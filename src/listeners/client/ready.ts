import { ApplyOptions } from '@sapphire/decorators';
import type { ListenerOptions } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import { Eclass } from '@/models/eclass';
import { ReactionRole } from '@/models/reactionRole';
import { EclassStatus } from '@/types/database';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
  public async run(): Promise<void> {
    this.container.client.checkValidity();

    this.container.logger.info('[Logs] Syncing logs statuses...');
    await this.container.client.syncLogStatuses();

    this.container.logger.info('[ConfigurationManager] Caching configured channels and roles...');
    await this.container.client.configManager.loadAll();

    this.container.logger.info('[Logs] Caching invites...');
    for (const guild of this.container.client.guilds.cache.values())
      await guild.invites.fetch();

    this.container.logger.info('[Reaction Roles] Caching reactions-roles menus...');
    const reactionRoles = await ReactionRole.find();
    for (const rr of reactionRoles) {
      // TODO: Improve the "remove-if-fail" logic. What if the channel was deleted? What if we just don't have perm?
      const channel = this.container.client.channels.cache.get(rr.channelId) as TextChannel;
      channel?.messages.fetch(rr.messageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(rr._id);
          this.container.client.reactionRolesIds.delete(rr.messageId);
        });
    }

    this.container.logger.info('[Reaction Roles] Caching eclass announcement...');
    const eclasses = await Eclass.find({ status: EclassStatus.Planned });
    for (const eclass of eclasses) {
      const channel = await this.container.client.configManager.get(eclass.announcementChannelId, eclass.guildId);
      channel?.messages.fetch(eclass.announcementMessageId)
        .catch(() => {
          this.container.logger.warn(`[Eclass] Failed to fetch announcement message for eclass ${eclass._id}.`);
        });
    }

    this.container.logger.info('All caching done!');
  }
}
