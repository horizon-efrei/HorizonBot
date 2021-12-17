import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import ReactionRole from '@/models/reactionRole';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';
import type { MessageDeleteAuditLogs } from '@/types/discord-js';
import { isGuildMessage, nullop } from '@/utils';

export default class MessageDeleteListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (message.system || message.partial || message.channel.partial || !isGuildMessage(message))
      return;

    if (!message.author.bot) {
      const auditLogs = await message.guild.fetchAuditLogs({ type: 'MESSAGE_DELETE' }).catch(nullop) as MessageDeleteAuditLogs;
      // We can't filter by the message's id, the best we can do is filter by the channel id...
      const lastMessageDelete = auditLogs.entries.filter(entry => (
        typeof entry.extra.channel === 'string'
          ? entry.extra.channel === message.channel.id
          : entry.extra.channel.id === message.channel.id))
        .first();

      await DiscordLogManager.logAction({
        type: DiscordLogType.MessageRemove,
        context: {
          messageId: message.id,
          channelId: message.channel.id,
          authorId: message.author.id,
          executorId: lastMessageDelete?.executor?.id ?? message.author.id,
        },
        content: message.content,
        guildId: message.guild.id,
        severity: 1,
      });
    }

    if (this.container.client.reactionRolesIds.has(message.id)) {
      await ReactionRole.findOneAndRemove({ messageId: message.id });
      this.container.client.reactionRolesIds.delete(message.id);
      this.container.logger.debug(`[Reaction Roles] Removed reaction-role message ${message.id} because it was deleted. (url: ${message.url})`);
    }
  }
}
