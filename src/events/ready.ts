import { ApplyOptions } from '@sapphire/decorators';
import type { EventOptions } from '@sapphire/framework';
import { Event } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import FlaggedMessageDB from '@/models/flaggedMessage';
import ReactionRole from '@/models/reactionRole';
import FlaggedMessage from '@/structures/FlaggedMessage';
import { ConfigEntries } from '../lib/types/database';

@ApplyOptions<EventOptions>({ once: true })
export default class ReadyEvent extends Event {
  public async run(): Promise<void> {
    this.context.client.checkValidity();

    this.context.logger.info('[Reaction Roles] Caching reactions roles...');
    const reactionRoles = await ReactionRole.find();
    for (const rr of reactionRoles) {
      const channel = this.context.client.channels.cache.get(rr.channelId);
      const textChannel = channel as TextChannel;
      textChannel.messages.fetch(rr.messageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(rr._id);
          this.context.client.reactionRolesIds = this.context.client.reactionRolesIds
            .filter(elt => elt !== rr.messageId);
        });
    }

    this.context.logger.info('[Anti Swear] Caching alert messages...');
    const flaggedMessages = await FlaggedMessageDB.find();
    for (const flaggedMessage of flaggedMessages) {
      const logChannel = await this.context.client.configManager.get(
        flaggedMessage.guildId,
        ConfigEntries.ModeratorFeedback,
      );
      logChannel.messages.fetch(flaggedMessage.alertMessageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await FlaggedMessageDB.findByIdAndDelete(flaggedMessage._id);
          this.context.client.flaggedMessages = this.context.client.flaggedMessages
            .filter(elt => elt.message.id !== flaggedMessage.messageId);
        });
    }

    // TODO: Do we even need to parse them all now?
    // FIXME: dont await each in the loop, parse them all in parallel and bulk-add them after.
    for (const flaggedMessage of flaggedMessages) {
      const parsedFlaggedMessage = await FlaggedMessage.fromDocument(flaggedMessage);
      this.context.client.flaggedMessages.push(parsedFlaggedMessage);
    }
  }
}
