import { container } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import FlaggedMessageDB from '@/models/flaggedMessage';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import type { FlaggedMessageDocument } from '@/types/database';
import { ConfigEntriesChannels } from '@/types/database';
import { nullop, trimText } from '@/utils';

export default class FlaggedMessage {
  protected logChannel: GuildTextBasedChannel;

  constructor(
    public readonly message: GuildMessage,
    public readonly moderator: GuildMember,
  ) {}

  public static async fromDocument(document: FlaggedMessageDocument): Promise<FlaggedMessage> {
    // Fetch the channel, the "victim", the moderator, and finally the problematic message
    const channel = container.client.channels.resolve(document.channelId) as GuildTextBasedChannel;
    const moderator = await channel.guild.members.fetch(document.moderatorId);
    const message = await channel.messages.fetch(document.messageId) as GuildMessage;

    // Create the flag message and assign its properties
    const flaggedMessage = new FlaggedMessage(message, moderator);
    flaggedMessage.logChannel = await container.client.configManager.get(
      ConfigEntriesChannels.ModeratorFeedback,
      flaggedMessage.message.guild.id,
    );
    return flaggedMessage;
  }

  public async start(): Promise<void> {
    const document = await FlaggedMessageDB.findOne({ messageId: this.message.id }).catch(nullop);
    if (document)
      return;

    await this._alertModerators();
    await this._addToDatabase();
    await this.alertUser();
    container.logger.debug(`[Anti Swear] New flagged message added ${this.message.id} (${this.message.url}).`);
  }

  public async remove(): Promise<void> {
    // Remove the message from the cache & database, and remove the bot's message
    container.client.waitingFlaggedMessages = container.client.waitingFlaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await FlaggedMessageDB.findOneAndRemove({ messageId: this.message.id });
  }

  public async alertUser(): Promise<void> {
    try {
      await this.message.member.send(pupa(messages.antiSwear.swearUserAlertPrivate, { message: this.message }));
    } catch {
      await this.message.channel.send(pupa(messages.antiSwear.swearUserAlertPublic, { message: this.message }));
    }
  }

  private async _addToDatabase(): Promise<void> {
    await FlaggedMessageDB.create({
      guildId: this.message.guild.id,
      channelId: this.message.channel.id,
      messageId: this.message.id,
      authorId: this.message.author.id,
      moderatorId: this.moderator.id,
    });
  }

  private async _alertModerators(): Promise<void> {
    // Cache the log channel if not already
    if (!this.logChannel) {
      this.logChannel = await container.client.configManager.get(
        ConfigEntriesChannels.ModeratorFeedback,
        this.message.guild.id,
      );
    }

    // Send the alert to the moderators
    if (this.logChannel) {
      const payload = { message: this.message, moderator: this.moderator };
      await this.logChannel.send(
        pupa(messages.antiSwear.swearModeratorAlert, { ...payload, preview: trimText(this.message.content, 200) }),
      );
    } else {
      container.logger.warn('[Anti Swear] A swear was detected but no log channel was found, unable to report. Setup a log channel with "/setup set-channel name:mod channel:<channel>"');
    }
  }
}
