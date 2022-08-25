import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export default class MessageUpdateListener extends Listener {
  public async run(oldMessage: Message, newMessage: Message): Promise<void> {
    if (newMessage.author.bot || newMessage.system || !newMessage.inGuild())
      return;

    await DiscordLogManager.logAction({
      type: DiscordLogType.MessageEdit,
      context: { messageId: newMessage.id, channelId: newMessage.channel.id, authorId: newMessage.author.id },
      content: { before: oldMessage.content, after: newMessage.content },
      guildId: newMessage.guild.id,
      severity: 1,
    });
  }
}
