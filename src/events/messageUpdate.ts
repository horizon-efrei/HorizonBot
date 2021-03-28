import { Event } from '@sapphire/framework';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';

export default class MessageUpdateEvent extends Event {
  public async run(_oldMessage: GuildMessage, newMessage: GuildMessage): Promise<void> {
    if (newMessage.author.bot || newMessage.system)
      return;

    // Swearing check
    const flaggedMessage = this.context.client.flaggedMessages.find(msg => msg.message.id === newMessage.id);
    const swear = FlaggedMessage.getSwear(newMessage);

    if (flaggedMessage && !swear)
      await flaggedMessage.remove();
    else if (!flaggedMessage && swear)
      new FlaggedMessage(newMessage, swear);
  }
}
