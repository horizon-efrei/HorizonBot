import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export class MessageUpdateListener extends Listener {
  public async run(oldMessage: Message, newMessage: Message): Promise<void> {
    if (newMessage.author.bot || newMessage.system || !newMessage.inGuild() || !oldMessage.inGuild())
      return;

    await DiscordLogManager.logAction({
      type: DiscordLogType.MessageUpdate,
      context: { messageId: newMessage.id, channelId: newMessage.channel.id, authorId: newMessage.author.id },
      content: {
        before: {
          messageContent: oldMessage.content,
          attachments: oldMessage.attachments.map(({ url, name, id }) => ({ url, name: name ?? id })),
        },
        after: {
          messageContent: newMessage.content,
          attachments: newMessage.attachments.map(({ url, name, id }) => ({ url, name: name ?? id })),
        },
      },
      guildId: newMessage.guild.id,
      severity: 1,
    });
  }
}
