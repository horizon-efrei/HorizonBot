import { Event } from '@sapphire/framework';
import pupa from 'pupa';
import { message as config } from '@/config/events';
import settings from '@/config/settings';
import type { GuildMessage } from '@/types';
import { ConfigEntries } from '@/types/database';

export default class MessageEvent extends Event {
  public async run(message: GuildMessage): Promise<void> {
    if (message.author.bot || message.system)
      return;

    // Swearing check
    const swear = settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
    if (swear) {
      const logChannel = await this.context.client.configManager.get(message.guild.id, ConfigEntries.ModeratorFeedback);
      await message.member.send(pupa(config.messages.swearUserAlert, { message, swear }));
      if (logChannel)
        await logChannel.send(pupa(config.messages.swearModAlert, { message, swear }));
    }
  }
}
