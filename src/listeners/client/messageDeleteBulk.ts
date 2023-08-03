import { Listener } from '@sapphire/framework';
import type { Collection, GuildTextBasedChannel, Snowflake } from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

export class MessageDeleteBulkListener extends Listener {
  public async run(messages: Collection<Snowflake, GuildMessage>, channel: GuildTextBasedChannel): Promise<void> {
      const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete }).catch(nullop);
      const lastMessageDelete = auditLogs?.entries
        .filter(entry => entry.target.id === channel.id && entry.createdTimestamp > Date.now() - 2000)
        .first();

      const getMessageContent = (message: GuildMessage): string =>
        message.content + (
          message.embeds.length > 0
            ? ` [${message.embeds.length} Embed${message.embeds.length > 1 ? 's' : ''}]`
            : ''
        );

      await DiscordLogManager.logAction({
        type: DiscordLogType.MessageDeleteBulk,
        context: {
          executorId: lastMessageDelete?.executor?.id,
          channelId: channel.id,
        },
        content: messages
          .values()
          .map(message => ({
            authorId: message.author.id,
            authorTag: message.author.tag,
            messageId: message.id,
            createdAt: message.createdAt,
            messageContent: getMessageContent(message),
            attachments: message.attachments.map(({ url, name, id }) => ({ url, name: name ?? id })),
          }))
          .toArray(),
        guildId: channel.guild.id,
        severity: 1,
      });
  }
}
