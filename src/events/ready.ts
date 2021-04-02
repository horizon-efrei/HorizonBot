import { ApplyOptions } from '@sapphire/decorators';
import type { EventOptions } from '@sapphire/framework';
import { Event } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import ReactionRole from '@/models/reactionRole';

@ApplyOptions<EventOptions>({ once: true })
export default class ReadyEvent extends Event {
  public async run(): Promise<void> {
    this.context.client.checkValidity();

    this.context.logger.info('Caching reactions roles...');
    const reactionRoles = await ReactionRole.find();
    for (const rr of reactionRoles) {
      const channel = this.context.client.channels.cache.get(rr.channelId);
      const textChannel = channel as TextChannel;
      textChannel.messages.fetch(rr.messageId)
        .catch(async () => {
          // If we failed to fetch the message, it is likely that it has been deleted, so we remove it too.
          await ReactionRole.findByIdAndDelete(rr._id);
          this.context.client.reactionRolesIds = this.context.client.reactionRolesIds
            .filter(elt => elt !== rr.messageId);
        });
    }
  }
}
