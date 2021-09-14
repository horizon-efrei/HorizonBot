import { container } from '@sapphire/pieces';
import { Formatters, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import DiscordLogs from '@/models/discordLogs';
import type { DiscordLogBase } from '@/types/database';
import { ConfigEntriesChannels, DiscordLogType } from '@/types/database';

const listAndFormatter = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });

export default {
  async logAction(payload: DiscordLogBase): Promise<void> {
    await DiscordLogs.create(payload);

    container.logger.info(`[Logs:${DiscordLogType[payload.type]}] New logged event happend: ${JSON.stringify(payload, (k, v) => (k === 'type' ? DiscordLogType[v] : v))}`);

    const logChannel = await container.client.configManager.get(ConfigEntriesChannels.Logs, payload.guildId);
    if (!logChannel)
      return;

    const fieldTexts = messages.logs.fields[payload.type];
    const contentValue: string = this.getContentValue(payload);

    const embed = new MessageEmbed()
      .setAuthor(messages.logs.embedTitle)
      .setColor(settings.colors.default)
      .setTitle(messages.logs.readableEvents.get(payload.type))
      .addField(fieldTexts.contextName, pupa(fieldTexts.contextValue, payload), true)
      .addField(fieldTexts.contentName, contentValue, true)
      .setTimestamp();
    await logChannel?.send({ embeds: [embed] });
  },

  getContentValue(payload: DiscordLogBase): string {
    const guild = container.client.guilds.cache.get(payload.guildId);
    const fieldTexts = messages.logs.fields[payload.type];

    switch (payload.type) {
      case DiscordLogType.GuildJoin: {
        const invites = guild.invites.cache;
        return payload.content.map(code => pupa(fieldTexts.contentValue, { code, link: invites.get(code) })).join('\nou : ');
      }
      case DiscordLogType.GuildLeave: {
        return pupa(fieldTexts.contentValue, {
          ...payload,
          content: {
            ...payload.content,
            roles: payload.content.roles.length > 0
              ? listAndFormatter.format(payload.content.roles.map(Formatters.roleMention))
              : 'aucun',
            joinedAt: Math.round(payload.content.joinedAt / 1000),
          },
        });
      }
      case DiscordLogType.RoleAdd:
      case DiscordLogType.RoleRemove:
        return pupa(fieldTexts.contentValue, {
          ...payload,
          content: listAndFormatter.format(payload.content.map(Formatters.roleMention)),
        });
      case DiscordLogType.MessageEdit:
      case DiscordLogType.MessagePost:
      case DiscordLogType.MessageRemove:
      case DiscordLogType.ReactionAdd:
      case DiscordLogType.ReactionRemove:
      case DiscordLogType.Rename:
      case DiscordLogType.VoiceJoin:
      case DiscordLogType.VoiceLeave:
        return pupa(fieldTexts.contentValue, payload);
    }
  },
};
