import { Listener } from '@sapphire/framework';
import type { GuildEmoji } from 'discord.js';
import { ReactionRole } from '@/models/reactionRole';

export class EmojiUpdateListener extends Listener {
  public async run(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Promise<void> {
    if (oldEmoji.toString() === newEmoji.toString())
      return;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const affectedReactionRoles = await ReactionRole.find({ 'reactionRolePairs.reaction': oldEmoji.toString() });

    for (const reactionRole of affectedReactionRoles) {
      for (const [i, pair] of reactionRole.reactionRolePairs.entries()) {
        if (pair.reaction === oldEmoji.toString())
          reactionRole.reactionRolePairs.set(i, { role: pair.role, reaction: newEmoji.toString() });
      }
      await reactionRole.save();
    }
  }
}
