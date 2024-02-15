import { ApplyOptions } from '@sapphire/decorators';
import type { ListenerOptions } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import { Collection } from 'discord.js';
import { Eclass } from '@/models/eclass';
import { LogStatuses } from '@/models/logStatuses';
import { ReactionRole } from '@/models/reactionRole';
import { DiscordLogType, EclassStatus, LogStatuses as LogStatusesEnum } from '@/types/database';
import type { LogStatusesBase } from '@/types/database';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
  public async run(): Promise<void> {
    await this.container.client.loading;

    this.container.client.checkValidity();

    this.container.logger.info('[Online Cache] Caching configured channels and roles...');
    await this.container.configManager.loadAll();

    this.container.logger.info('[Online Cache] Caching invites...');
    await this._cacheInvites();

    this.container.logger.info('[Online Cache] Caching reactions-roles menus...');
    await this._cacheReactionRoleMenus();

    this.container.logger.info('[Online Cache] Caching eclass announcement...');
    await this._cacheEclassAnnouncements();

    this.container.logger.info('[Online Cache] Loading log statuses...');
    await this._loadLogStatuses();

    this.container.logger.info('[Online Cache] Validating subjects...');
    await this._validateSubjects();

    this.container.logger.info('[Online Cache] All caching done!');
  }

  private async _cacheInvites(): Promise<void> {
    for (const guild of this.container.client.guilds.cache.values())
      await guild.invites.fetch();
  }

  private async _cacheReactionRoleMenus(): Promise<void> {
    const reactionRoles = await ReactionRole.find();
    for (const rr of reactionRoles) {
      // FIXME: Improve the "remove-if-fail" logic. What if the channel was deleted? What if we just don't have perm?
      const channel = this.container.client.channels.cache.get(rr.channelId) as TextChannel;
      channel?.messages.fetch(rr.messageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(rr._id);
          this.container.caches.reactionRolesIds.delete(rr.messageId);
        });
    }
  }

  private async _cacheEclassAnnouncements(): Promise<void> {
    const eclasses = await Eclass.find({ status: EclassStatus.Planned });
    for (const eclass of eclasses) {
      const channel = await this.container.configManager.get(eclass.announcementChannelId, eclass.guildId);
      channel?.messages.fetch(eclass.announcementMessageId)
        .catch(() => {
          this.container.logger.warn(`[Eclass] Failed to fetch announcement message for eclass ${eclass._id}.`);
        });
    }
  }

  private async _loadLogStatuses(): Promise<void> {
    const logs = await LogStatuses.find();
    const docs: LogStatusesBase[] = [];

    for (const guildId of this.container.client.guilds.cache.keys()) {
      this.container.caches.logStatuses.set(guildId, new Collection());

      for (const type of Object.values(DiscordLogType)) {
        const currentSetting = logs.find(log => log.guildId === guildId && log.type === type);

        this.container.caches.logStatuses.get(guildId)!.set(type, currentSetting?.status ?? LogStatusesEnum.Discord);
        if (!currentSetting)
          docs.push({ guildId, type, status: LogStatusesEnum.Discord });
      }
    }
    await LogStatuses.insertMany(docs);
  }

  private async _validateSubjects(): Promise<void> {
    const errors = await this.container.subjectsManager.validate();
    if (errors.length > 0) {
      this.container.logger.error('[Subjects] The following errors were found in the subjects sheet:');
      for (const error of errors)
        this.container.logger.error(`[Subjects] Row ${error.row}: ${error.error}`);
    }
  }
}
