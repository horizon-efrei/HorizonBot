import type { PieceContextExtras } from '@sapphire/pieces';
import { Store } from '@sapphire/pieces';
import type { GuildMember } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import FlaggedMessageDB from '@/models/flaggedMessage';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import type { FlaggedMessageDocument } from '@/types/database';
import { ConfigEntries } from '@/types/database';

export default class FlaggedMessage {
  logChannel: GuildTextBasedChannel;
  alertMessage: GuildMessage;
  context: PieceContextExtras;
  approvedDate = -1;
  approved = false;

  constructor(
    public readonly message: GuildMessage,
    public readonly swear: string,
  ) {
    this.context = Store.injectedContext;
  }

  public static getSwear(message: GuildMessage): string {
    return settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
  }

  public static async fromDocument(document: FlaggedMessageDocument): Promise<FlaggedMessage> {
    const channel = Store.injectedContext.client.channels.resolve(document.channelId) as GuildTextBasedChannel;
    const message = await channel.messages.fetch(document.messageId) as GuildMessage;

    const flaggedMessage = new FlaggedMessage(message, document.swear);
    flaggedMessage.logChannel = await Store.injectedContext.client.configManager.get(
      flaggedMessage.message.guild.id,
      ConfigEntries.ModeratorFeedback,
    );
    flaggedMessage.alertMessage = await flaggedMessage.logChannel.messages
      .fetch(document.alertMessageId) as GuildMessage;
    return flaggedMessage;
  }

  public async start(): Promise<void> {
    this.context.client.flaggedMessages.push(this);
    await this._alertModerators();
    await this._addToDatabase();
  }

  public async remove(): Promise<void> {
    // Remove the message from the cache & database, and remove the bot's message
    this.context.client.flaggedMessages = this.context.client.flaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await this.alertMessage.delete();
    await FlaggedMessageDB.findOneAndRemove({ messageId: this.message.id });
  }

  public async approve(moderator: GuildMember): Promise<void> {
    // Remove the message from the cache, and update the bot's message
    this.context.client.flaggedMessages = this.context.client.flaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await FlaggedMessageDB.updateOne(
      { messageId: this.message.id },
      { approved: true, approvedDate: Date.now() },
    );
    await this.alertMessage.reactions.removeAll();
    await this.alertMessage.edit(
      pupa(
        messages.antiSwear.swearModAlertUpdate,
        { message: this.message, swear: this.swear, moderator },
      ),
    );

    await this.alertUser();
  }

  public async alertUser(): Promise<void> {
    const payload = { message: this.message, swear: this.swear };
    try {
      await this.message.member.send(pupa(messages.antiSwear.swearUserAlert, payload));
    } catch {
      await this.message.channel.send(pupa(messages.antiSwear.swearUserAlertPublic, payload));
    }
  }

  private async _addToDatabase(): Promise<void> {
    await FlaggedMessageDB.create({
      guildId: this.message.guild.id,
      channelId: this.message.channel.id,
      messageId: this.message.id,
      swear: this.swear,
      alertMessageId: this.alertMessage.id,
      approved: false,
    });
  }

  private async _alertModerators(): Promise<void> {
    // Cache the log channel if not already
    if (!this.logChannel) {
      this.logChannel = await this.context.client.configManager.get(
        this.message.guild.id,
        ConfigEntries.ModeratorFeedback,
      );
    }

    // Send the alert to the moderators
    if (this.logChannel) {
      const payload = { message: this.message, swear: this.swear };
      this.alertMessage = await this.logChannel.send(pupa(messages.antiSwear.swearModAlert, payload)) as GuildMessage;
      await this.alertMessage.react('✅');
    } else {
      this.context.logger.warn(`[Anti Swear] A swear was detected but no log channel was found, unable to report. Setup a log channel with "${settings.prefix}setup mod"`);
    }
  }
}
