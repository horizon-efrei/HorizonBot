import { Listener } from '@sapphire/framework';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';

export default class MessageUpdateListener extends Listener {
  public async run(_oldMessage: GuildMessage, newMessage: GuildMessage): Promise<void> {
    if (newMessage.author.bot || newMessage.system)
      return;

    // Swearing check
    const flaggedMessage = this.container.client.waitingFlaggedMessages.find(msg => msg.message.id === newMessage.id);
    const swear = FlaggedMessage.getSwear(newMessage);

    if (flaggedMessage && !swear)
      await flaggedMessage.remove();
    else if (!flaggedMessage && swear)
      await new FlaggedMessage(newMessage, { swear }).start();
  }
}
