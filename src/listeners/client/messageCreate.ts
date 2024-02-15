import { Listener } from '@sapphire/framework';
import { filterNullAndUndefined } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import pupa from 'pupa';
import { messages } from '@/config/messages';
import { settings } from '@/config/settings';
import { RoleIntersection } from '@/models/roleIntersections';
import { logAction } from '@/structures/logs/DiscordLogManager';
import { ConfigEntriesChannels, DiscordLogType } from '@/types/database';

export class MessageListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (message.author.bot
      || message.partial
      || message.channel.partial
      || message.system
      || !message.inGuild())
      return;

    await this._log(message);

    await this._handleTempIntersectionRoles(message);

    await this._handlePreAnnouncements(message);
  }

  private async _log(message: Message<true>): Promise<void> {
    await logAction({
      type: DiscordLogType.MessageCreate,
      context: { messageId: message.id, channelId: message.channel.id, authorId: message.author.id },
      content: {
        messageContent: message.content,
        attachments: message.attachments.map(({ url, name, id }) => ({ url, name: name ?? id })),
      },
      guildId: message.guild.id,
      severity: 1,
    });

    const invites = message.content.matchAll(new RegExp(settings.configuration.discordInviteLinkRegex, 'gi'));
    const foreignInvites = invites
      .map(invite => invite.groups?.code)
      .filter(code => code && !message.guild.invites.cache.has(code))
      .map(code => `https://discord.gg/${code}`)
      .toArray();

    if (foreignInvites.length > 0) {
      await logAction({
        type: DiscordLogType.InvitePost,
        context: { messageId: message.id, channelId: message.channel.id, authorId: message.author.id },
        content: foreignInvites,
        guildId: message.guild.id,
        severity: 1,
      });
    }
  }

  private async _handleTempIntersectionRoles(message: Message<true>): Promise<void> {
    const mentionedTempIntersectionRoles = this.container.caches.roleIntersections
      .filter(r => message.mentions.roles.has(r))
      .map(roleId => message.guild.roles.resolve(roleId))
      .filter(filterNullAndUndefined);
    if (mentionedTempIntersectionRoles.size > 0) {
      this.container.logger.debug(`[Intersection Roles] ${mentionedTempIntersectionRoles.size} role was just mentioned by ${message.author.username}. It will expire in two days.`);

      for (const role of mentionedTempIntersectionRoles) {
        await RoleIntersection.findOneAndUpdate(
          { roleId: role.id, guildId: role.guild.id },
          { expiration: Date.now() + settings.configuration.roleIntersectionExpiration },
          { upsert: true },
        );
      }
    }
  }

  private async _handlePreAnnouncements(message: Message<true>): Promise<void> {
    const channel = this.container.configManager.getFromCache(
      ConfigEntriesChannels.PreAnnouncements,
      message.guildId,
    );

    if (message.channel.id !== channel?.id)
      return;

    const thread = await message.startThread({ name: messages.preAnnouncements.threadName });
    await thread.send({
      content: pupa(messages.preAnnouncements.threadMessage, { author: message.author }),
      components: [...messages.preAnnouncements.copyButton.components],
    });
  }
}
