import { ApplyOptions } from '@sapphire/decorators';
import type { EventOptions } from '@sapphire/framework';
import { Event } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import Eclass from '@/models/eclass';
import FlaggedMessageDB from '@/models/flaggedMessage';
import ReactionRole from '@/models/reactionRole';
import FlaggedMessage from '@/structures/FlaggedMessage';
import { ConfigEntries, EclassStatus } from '@/types/database';

@ApplyOptions<EventOptions>({ once: true })
export default class ReadyEvent extends Event {
  public async run(): Promise<void> {
    this.context.client.checkValidity();

    this.context.logger.info('[Reaction Roles] Caching reactions-roles menus...');
    const reactionRoles = await ReactionRole.find();
    for (const rr of reactionRoles) {
      const channel = this.context.client.channels.cache.get(rr.channelId);
      const textChannel = channel as TextChannel;
      textChannel.messages.fetch(rr.messageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(rr._id);
          this.context.client.reactionRolesIds.delete(rr.messageId);
        });
    }

    this.context.logger.info('[Reaction Roles] Caching eclass annoucement...');
    const eclasses = await Eclass.find({ status: EclassStatus.Planned });
    for (const eclass of eclasses) {
      const channel = await this.context.client.configManager.get(eclass.guild, eclass.announcementChannel);

      channel.messages.fetch(eclass.announcementMessage)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(eclass._id);
          this.context.client.reactionRolesIds.delete(eclass.announcementMessage);
        });
    }

    this.context.logger.info('[Anti Swear] Caching alert messages...');
    let flaggedMessages = await FlaggedMessageDB.find({ approved: false });
    for (const flaggedMessage of flaggedMessages) {
      const logChannel = await this.context.client.configManager.get(
        flaggedMessage.guildId,
        ConfigEntries.ModeratorFeedback,
      );
      logChannel.messages.fetch(flaggedMessage.alertMessageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await FlaggedMessageDB.findByIdAndDelete(flaggedMessage._id);
          flaggedMessages = flaggedMessages.filter(msg => msg._id !== flaggedMessage._id);
          this.context.client.waitingFlaggedMessages = this.context.client.waitingFlaggedMessages
            .filter(elt => elt.message.id !== flaggedMessage.messageId);
        });
    }

    // TODO: Do we even need to parse them all now?
    // FIXME: dont await each in the loop, parse them all in parallel and bulk-add them after.
    for (const flaggedMessage of flaggedMessages) {
      const parsedFlaggedMessage = await FlaggedMessage.fromDocument(flaggedMessage);
      this.context.client.waitingFlaggedMessages.push(parsedFlaggedMessage);
    }
  }
}
