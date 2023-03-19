import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { AuditLogEvent, User } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import ReactionRole from '@/models/reactionRole';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';
import { noop, nullop } from '@/utils';

export default class MessageDeleteListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (message.system || message.partial || message.channel.partial || !message.inGuild())
      return;

    if (!message.author.bot) {
      const auditLogs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete }).catch(nullop);
      // We can't filter by the message's id, the best we can do is filter by the channel id...
      const lastMessageDelete = auditLogs?.entries
        .filter(entry => entry.extra.channel.id === message.channel.id && entry.createdTimestamp > Date.now() - 2000)
        .first();

      await DiscordLogManager.logAction({
        type: DiscordLogType.MessageDelete,
        context: {
          messageId: message.id,
          channelId: message.channel.id,
          authorId: message.author.id,
          executorId: lastMessageDelete?.executor?.id ?? message.author.id,
        },
        content: {
          messageContent: message.content,
          attachments: message.attachments.map(({ url, name, id }) => ({ url, name: name ?? id })),
        },
        guildId: message.guild.id,
        severity: 1,
      });
    }

    if (this.container.client.reactionRolesIds.has(message.id)) {
      await ReactionRole.findOneAndRemove({ messageId: message.id });
      this.container.client.reactionRolesIds.delete(message.id);
      this.container.logger.debug(`[Reaction Roles] Removed reaction-role message ${message.id} because it was deleted. (url: ${message.url})`);
    }

    await this._checkAntiGhostPing(message);
  }

  private async _checkAntiGhostPing(message: GuildMessage): Promise<void> {
    // List of all the users that were mentionned in the deleted message.
    const userMentions = message.mentions.users.values()
      .filter(usr => !usr.bot && usr.id !== message.author.id);
    // List of all the roles that were mentionned in the deleted message.
    const roleMentions = message.mentions.roles
      .values()
      .filter(role => !role.managed)
      .toArray();
    // List of users/roles that were mentionned.
    const mentions = [...userMentions, ...roleMentions];

    // If no-one was mentionned, then ignore.
    if (mentions.length === 0)
      return;

    // Choose the message (plural if multiple people (or a role) were ghost-ping)
    const severalPeopleAffected = mentions.length > 1 || roleMentions.length > 0;
    const baseMessage = severalPeopleAffected
      ? messages.ghostPing.alertPlural
      : messages.ghostPing.alertSingular;

    const botNotificationMessage = await message.channel.send(
      pupa(baseMessage, {
        mentions: mentions
          .map(mention => (mention instanceof User ? mention.username : mention.name))
          .join(', '),
        user: message.author,
      }),
    ).catch(noop);
    if (!botNotificationMessage)
      return;

    // If a group of people were ghost-ping, we don't want one people to just remove the alert.
    if (severalPeopleAffected)
      return;

    await botNotificationMessage.react(settings.emojis.remove).catch(noop);
    const collector = botNotificationMessage
      .createReactionCollector({
        filter: (r, user) => (r.emoji.id ?? r.emoji.name) === settings.emojis.remove
          && (user.id === message.mentions.users.first()!.id)
          && !user.bot,
      }).on('collect', async () => {
        collector.stop();
        await botNotificationMessage.delete().catch(noop);
      });
  }
}
