import { Event } from '@sapphire/framework';
import settings from '@/config/settings';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';

export default class MessageEvent extends Event {
  public run(message: GuildMessage): void {
    if (message.author.bot || message.system)
      return;

    // Swearing check
    const swear = settings.configuration.swears.find(swr => message.cleanContent.split(' ').includes(swr));
    if (swear)
      new FlaggedMessage(message, swear);
  }
}
