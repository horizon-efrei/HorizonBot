import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

export class UserUpdateListener extends Listener {
  public async run(oldUser: User, newUser: User): Promise<void> {
    if (oldUser.username !== newUser.username) {
      for (const [guildId, guild] of this.container.client.guilds.cache) {
        const member = await guild.members.fetch({ user: newUser.id, force: false }).catch(nullop);
        if (member) {
          await DiscordLogManager.logAction({
            type: DiscordLogType.UserUsernameUpdate,
            context: newUser.id,
            content: { before: oldUser.username, after: newUser.username },
            guildId,
            severity: 1,
          });
        }
      }
    }
  }
}
