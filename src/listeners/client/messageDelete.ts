import { Listener } from '@sapphire/framework';
import ReactionRole from '@/models/reactionRole';
import type { GuildMessage } from '@/types';

export default class MessageDeleteListener extends Listener {
  public async run(message: GuildMessage): Promise<void> {
    if (message.system)
      return;

    if (this.container.client.reactionRolesIds.has(message.id)) {
      await ReactionRole.findOneAndRemove({ messageId: message.id });
      this.container.client.reactionRolesIds.delete(message.id);
      this.container.logger.debug(`[Reaction Roles] Removed reaction-role message ${message.id} because it was deleted. (url: ${message.url})`);
    }
  }
}
