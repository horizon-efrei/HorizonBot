import type { PieceContextExtras } from '@sapphire/pieces';
import { Store } from '@sapphire/pieces';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import { ConfigEntries } from '@/types/database';
import { noop } from '@/utils';

export default class FlaggedMessage {
  logChannel: GuildTextBasedChannel;
  botMessage: GuildMessage;
  context: PieceContextExtras;
  approvedDate = -1;
  approved = false;

  constructor(
    public readonly message: GuildMessage,
    public readonly swear: string,
  ) {
    this.context = Store.injectedContext;
    this.context.client.flaggedMessages.push(this);
    void this._alertModerators();
  }

  public static getSwear(message: GuildMessage): string {
    return settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
  }

  public async remove(): Promise<void> {
    // Remove the message from the array, and remove the bot message
    this.context.client.flaggedMessages = this.context.client.flaggedMessages
      .filter(msg => msg.message.id !== this.message.id);
    await this.botMessage.delete();
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
      this.botMessage = await this.logChannel.send(pupa(messages.antiSwear.swearModAlert, payload)) as GuildMessage;

      await this.botMessage.react('✅');

      // Wait for a moderator to approve the suppression of the message
      const collector = this.botMessage
        .createReactionCollector((reaction, user) => !user.bot && reaction.emoji.name === '✅')
        .on('collect', async (_reaction, user) => {
          try {
            collector.stop();
            await this.botMessage.reactions.removeAll();

            const moderator = this.message.guild.members.resolve(user);
            await this.botMessage.edit(pupa(messages.antiSwear.swearModAlertUpdate, { ...payload, moderator }));

            this.approved = true;
            this.approvedDate = Date.now();

            void this._alertUser();
          } catch (error: unknown) {
            this.context.logger.error('[Anti Swear] An error occured while trying to confirm a flagged message...');
            this.context.logger.error(error);
            this.botMessage.channel.send(messages.global.oops).catch(noop);
          }
        });
    } else {
      this.context.logger.warn(`[Anti Swear] A swear was detected but no log channel was found, unable to report. Setup a log channel with "${settings.prefix}setup mod"`);
    }
  }

  private async _alertUser(): Promise<void> {
    const payload = { message: this.message, swear: this.swear };
    try {
      await this.message.member.send(pupa(messages.antiSwear.swearUserAlert, payload));
    } catch {
      await this.message.channel.send(pupa(messages.antiSwear.swearUserAlertPublic, payload));
    }
  }
}
