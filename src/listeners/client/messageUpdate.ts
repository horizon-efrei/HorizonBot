import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';
import { isGuildMessage } from '@/utils';

export default class MessageUpdateListener extends Listener {
  public async run(oldMessage: GuildMessage, newMessage: Message): Promise<void> {
    if (newMessage.author.bot || newMessage.system || !isGuildMessage(newMessage))
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
