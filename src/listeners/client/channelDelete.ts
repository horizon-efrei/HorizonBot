import { Listener } from '@sapphire/framework';
import type { DMChannel, GuildChannel } from 'discord.js';
import ReactionRole from '@/models/reactionRole';

export default class ChannelDeleteListener extends Listener {
  public async run(channel: DMChannel | GuildChannel): Promise<void> {
    if (channel.type === 'DM')
      return;

    const affectedReactionRoles = await ReactionRole.find({ channelId: channel.id });
    if (affectedReactionRoles.length > 0) {
      await ReactionRole.deleteMany({ channelId: channel.id });
      const messageIds = affectedReactionRoles.map(rr => rr.messageId);
      this.container.client.reactionRolesIds.deleteAll(...messageIds);
      this.container.logger.debug(`[Reaction Roles] Removed reaction-role messages ${messageIds.join(', ')} because the channel ${channel.id} (#${channel.name}) was deleted.`);
    }
  }
}
