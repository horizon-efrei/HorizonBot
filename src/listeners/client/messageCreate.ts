import { Listener } from '@sapphire/framework';
import { filterNullAndUndefined } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import messages from '@/config/messages';
import settings from '@/config/settings';
import RoleIntersections from '@/models/roleIntersections';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

const discordInviteLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)(?<code>[\w\d-]{2,})/gimu;

export default class MessageListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (message.author.bot
      || message.partial
      || message.channel.partial
      || message.system)
      return;

    if (message.inGuild()) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.MessagePost,
        context: { messageId: message.id, channelId: message.channel.id, authorId: message.author.id },
        content: message.content,
        guildId: message.guild.id,
        severity: 1,
      });
    }

    if (message.content.startsWith('!')) {
      await message.reply(messages.global.onlySlashCommands);
      return;
    }

    if (!message.inGuild())
      return;

    const invites = message.content.matchAll(discordInviteLinkRegex);
    const foreignInvites = [...invites]
      .map(invite => invite.groups?.code)
      .filter(code => code && !message.guild.invites.cache.has(code))
      .map(code => `https://discord.gg/${code}`);

    if (foreignInvites.length > 0) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.InvitePost,
        context: { messageId: message.id, channelId: message.channel.id, authorId: message.author.id },
        content: foreignInvites,
        guildId: message.guild.id,
        severity: 1,
      });
    }

    const mentionnedTempIntersectionRoles = this.container.client.roleIntersections
      .filter(r => message.mentions.roles.has(r))
      .map(roleId => message.guild.roles.resolve(roleId))
      .filter(filterNullAndUndefined);
    if (mentionnedTempIntersectionRoles.size > 0) {
      this.container.logger.debug(`[Intersection Roles] ${mentionnedTempIntersectionRoles.size} role was just mentionned by ${message.author.username}. It will expire in two days.`);

      for (const role of mentionnedTempIntersectionRoles) {
        await RoleIntersections.findOneAndUpdate(
          { roleId: role.id, guildId: role.guild.id },
          { expiration: Date.now() + settings.configuration.roleIntersectionExpiration },
          { upsert: true },
        );
      }
    }
  }
}
