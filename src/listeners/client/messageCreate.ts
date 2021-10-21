import { Listener } from '@sapphire/framework';
import settings from '@/config/settings';
import RoleIntersections from '@/models/roleIntersections';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';
import { ConfigEntriesRoles, DiscordLogType } from '@/types/database';

const discordInviteLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)(?<code>[\w\d-]{2,})/gimu;

export default class MessageListener extends Listener {
  public async run(message: GuildMessage): Promise<void> {
    if (message.author.bot || message.system)
      return;

    await DiscordLogManager.logAction({
      type: DiscordLogType.MessagePost,
      context: { messageId: message.id, channelId: message.channel.id, authorId: message.author.id },
      content: message.content,
      guildId: message.guild.id,
      severity: 1,
    });

    const invites = message.content.matchAll(discordInviteLinkRegex);
    const foreignInvites = [...invites]
      .map(invite => invite.groups?.code)
      .filter(code => !message.guild.invites.cache.has(code))
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

    const mentionnedTempIntersectionRoles = this.container.client.intersectionRoles
      .filter(r => message.mentions.roles.has(r))
      .map(roleId => message.guild.roles.resolve(roleId));
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

    // Swearing check
    const swear = settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
    const staffRole = await this.container.client.configManager.get(ConfigEntriesRoles.Staff, message.guild.id);
    if (swear && !message.member.roles.cache.has(staffRole.id))
      await new FlaggedMessage(message, { swear }).start();
  }
}
