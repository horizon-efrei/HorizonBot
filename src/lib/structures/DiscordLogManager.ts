import { container } from '@sapphire/pieces';
import type { EmbedFieldData } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import DiscordLogs from '@/models/discordLogs';
import type { DiscordLogBase } from '@/types/database';
import { ConfigEntriesChannels, DiscordLogType } from '@/types/database';

export default {
  async logAction(information: DiscordLogBase): Promise<void> {
    await DiscordLogs.create(information);

    container.logger.info(`[Logs:${DiscordLogType[information.type]}] New logged event happend: ${JSON.stringify(information, (k, v) => (k === 'type' ? DiscordLogType[v] : v))}`);

    const logChannel = await container.client.configManager.get(ConfigEntriesChannels.Logs, information.guildId);
    if (!logChannel)
      return;

    const fields = (this.getFields(information) as EmbedFieldData[]).map(field => ({ inline: true, ...field }));
    const embed = new MessageEmbed()
      .setAuthor(messages.logs.embedTitle)
      .setColor(settings.colors.default)
      .setTitle(messages.logs.readableEvents.get(information.type))
      .setFields(fields)
      .setTimestamp();
    await logChannel?.send({ embeds: [embed] });
  },

  getFields(information: DiscordLogBase): EmbedFieldData[] {
    const guild = container.client.guilds.cache.get(information.guildId);
    const fieldText = messages.logs.fields[information.type];

    switch (information.type) {
      case DiscordLogType.GuildJoin: {
        const invites = guild.invites.cache;
        return [{
          name: fieldText.contextName,
          value: pupa(fieldText.contextValue, information),
        }, {
          name: fieldText.contentName,
          value: information.content.map(link => pupa(fieldText.contentValue, { code: link, link: invites.get(link) })).join('\nou : '),
        }];
      }
      case DiscordLogType.GuildLeave:
      case DiscordLogType.MessageEdit:
      case DiscordLogType.MessagePost:
      case DiscordLogType.MessageRemove:
      case DiscordLogType.ReactionAdd:
      case DiscordLogType.ReactionRemove:
      case DiscordLogType.Rename:
      case DiscordLogType.RoleAdd:
      case DiscordLogType.RoleRemove:
      case DiscordLogType.VoiceJoin:
      case DiscordLogType.VoiceLeave:
        return [];
    }
  },
};
