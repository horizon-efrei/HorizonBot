import { Listener } from '@sapphire/framework';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';

export default class MessageUpdateListener extends Listener {
  public async run(oldMessage: GuildMessage, newMessage: GuildMessage): Promise<void> {
    if (newMessage.author.bot || newMessage.system)
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
