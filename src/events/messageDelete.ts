import { Event } from '@sapphire/framework';
import ReactionRole from '@/models/reactionRole';
import type { GuildMessage } from '@/types';

export default class MessageDeleteEvent extends Event {
  public async run(message: GuildMessage): Promise<void> {
    if (message.system)
      return;

    if (this.context.client.reactionRolesIds.includes(message.id)) {
      await ReactionRole.findOneAndRemove({ messageId: message.id });
      this.context.client.reactionRolesIds = this.context.client.reactionRolesIds.filter(elt => elt !== message.id);
      this.context.logger.info(`[Reaction Roles] Removed reaction-role message ${message.id} because it was deleted. (url: ${message.url})`);
    }
  }
}
