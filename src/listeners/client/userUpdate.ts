import { Listener } from '@sapphire/framework';
import type { User } from 'discord.js';
import DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export default class UserUpdateListener extends Listener {
  public async run(oldUser: User, newUser: User): Promise<void> {
    if (oldUser.username !== newUser.username) {
      for (const guildId of this.container.client.guilds.cache.keys()) {
        await DiscordLogManager.logAction({
          type: DiscordLogType.ChangeUsername,
          context: newUser.id,
          content: { before: oldUser.username, after: newUser.username },
          guildId,
          severity: 1,
        });
      }
    }
  }
}
