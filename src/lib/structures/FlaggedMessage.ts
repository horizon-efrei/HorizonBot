import { container } from '@sapphire/pieces';
import type { GuildMember } from 'discord.js';
import pupa from 'pupa';
import type { Object } from 'ts-toolbelt';
import messages from '@/config/messages';
import settings from '@/config/settings';
import FlaggedMessageDB from '@/models/flaggedMessage';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import type { FlaggedMessageDocument } from '@/types/database';
import { ConfigEntriesChannels } from '@/types/database';
import { noop, nullop, trimText } from '@/utils';

type FlaggedMessageData = Object.Either<{ manualModerator: GuildMember; swear: string }, 'manualModerator' | 'swear'>;

export default class FlaggedMessage {
  logChannel: GuildTextBasedChannel;
  alertMessage: GuildMessage;
  approvedDate = -1;
  approved = false;
  readonly swear?: string;
  readonly manualModerator?: GuildMember;

  constructor(
    public readonly message: GuildMessage,
    { swear, manualModerator }: FlaggedMessageData,
  ) {
    this.swear = swear;
    this.manualModerator = manualModerator;
  }

  public static getSwear(message: GuildMessage): string {
    return settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
  }

  public static async fromDocument(document: FlaggedMessageDocument): Promise<FlaggedMessage> {
    // Fetch the channel, the "victim", the manual moderator if any, and finally the problematic message
    const channel = container.client.channels.resolve(document.channelId) as GuildTextBasedChannel;
    await channel.guild.members.fetch(document.authorId).catch(noop);
    if (document.manualModeratorId)
      await channel.guild.members.fetch(document.manualModeratorId);
    const message = await channel.messages.fetch(document.messageId) as GuildMessage;

    // Create the flag message and assign its properties
    const flaggedMessage = new FlaggedMessage(message, { swear: document.swear });
    flaggedMessage.logChannel = await container.client.configManager.get(
      ConfigEntriesChannels.ModeratorFeedback,
      flaggedMessage.message.guild.id,
    );
    flaggedMessage.alertMessage = await flaggedMessage.logChannel.messages
      .fetch(document.alertMessageId) as GuildMessage;
    return flaggedMessage;
  }

  public async start(isManual = false): Promise<void> {
    const document = await FlaggedMessageDB.findOne({ messageId: this.message.id }).catch(nullop);
    if (document)
      return;

    if (isManual) {
      await this._alertModerators();
      await this._addManualToDatabase();
      await this.alertUser();
    } else {
      container.client.waitingFlaggedMessages.push(this);
      await this._confirmModerators();
      await this._addToDatabase();
    }
    container.logger.debug(`[Anti Swear] New flagged message added ${this.message.id} (${this.message.url}).`);
  }

  public async remove(): Promise<void> {
    // Remove the message from the cache & database, and remove the bot's message
    container.client.waitingFlaggedMessages = container.client.waitingFlaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await this.alertMessage.delete();
    await FlaggedMessageDB.findOneAndRemove({ messageId: this.message.id });
  }

  public async approve(moderator: GuildMember): Promise<void> {
    // Remove the message from the cache, and update the bot's message
    container.client.waitingFlaggedMessages = container.client.waitingFlaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await FlaggedMessageDB.updateOne(
      { messageId: this.message.id },
      { approved: true, approvedDate: Date.now() },
    );
    await this.alertMessage.reactions.removeAll();
    await this.alertMessage.edit(
      pupa(messages.antiSwear.swearModAlertUpdate, {
        message: this.message,
        swear: this.swear,
        moderator,
        preview: trimText(this.message.content, 200),
      }),
    );

    await this.alertUser();

    container.logger.debug(`[Anti Swear] Message ${this.message.id} (${this.message.url}) was just approved by moderator ${moderator.id} (${moderator.user.tag}).`);
  }

  public async alertUser(): Promise<void> {
    const privateMessage = this.swear
      ? messages.antiSwear.swearUserAlert
      : messages.antiSwear.swearManualUserAlert;
    const publicMessage = this.swear
      ? messages.antiSwear.swearUserAlertPublic
      : messages.antiSwear.swearManualUserAlertPublic;
    try {
      await this.message.member.send(pupa(privateMessage, { message: this.message, swear: this.swear }));
    } catch {
      await this.message.channel.send(pupa(publicMessage, { message: this.message, swear: this.swear }));
    }
  }

  private async _addManualToDatabase(): Promise<void> {
    await FlaggedMessageDB.create({
      guildId: this.message.guild.id,
      channelId: this.message.channel.id,
      messageId: this.message.id,
      authorId: this.message.author.id,
      manualModerator: this.manualModerator.id,
      approved: true,
      approvedDate: Date.now(),
    });
  }

  private async _addToDatabase(): Promise<void> {
    await FlaggedMessageDB.create({
      guildId: this.message.guild.id,
      channelId: this.message.channel.id,
      messageId: this.message.id,
      authorId: this.message.author.id,
      swear: this.swear,
      alertMessageId: this.alertMessage.id,
      approved: false,
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
      const payload = { message: this.message, manualModerator: this.manualModerator };
      await this.logChannel.send(
        pupa(messages.antiSwear.manualSwearAlert, { ...payload, preview: trimText(this.message.content, 200) }),
      );
    } else {
      container.logger.warn(`[Anti Swear] A swear was detected but no log channel was found, unable to report. Setup a log channel with "${settings.prefix}setup mod"`);
    }
  }

  private async _confirmModerators(): Promise<void> {
    // Cache the log channel if not already
    if (!this.logChannel) {
      this.logChannel = await container.client.configManager.get(
        ConfigEntriesChannels.ModeratorFeedback,
        this.message.guild.id,
      );
    }

    // Send the alert to the moderators
    if (this.logChannel) {
      const payload = { message: this.message, swear: this.swear };
      this.alertMessage = await this.logChannel.send(
        pupa(messages.antiSwear.swearModAlert, { ...payload, preview: trimText(this.message.content, 200) }),
      ) as GuildMessage;
      await this.alertMessage.react(settings.emojis.yes);
    } else {
      container.logger.warn(`[Anti Swear] A swear was detected but no log channel was found, unable to report. Setup a log channel with "${settings.prefix}setup mod"`);
    }
  }
}
