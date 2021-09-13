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
      .setTimestamp();
    await logChannel?.send({ embeds: [embed] });
  },
};
