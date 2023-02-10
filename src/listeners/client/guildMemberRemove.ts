import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export default class GuildMemberRemoveListener extends Listener {
  public async run(member: GuildMember): Promise<void> {
    await DiscordLogManager.logAction({
      type: DiscordLogType.GuildLeave,
      context: member.id,
      content: {
        userId: member.id,
        username: member.user.username,
        displayName: member.displayName,
        joinedAt: member.joinedTimestamp,
        // Filter out the @everyone role, and keep only ids
        roles: [...member.roles.cache.filter(role => role.rawPosition > 0).keys()],
      },
      guildId: member.guild.id,
      severity: 1,
    });
  }
}
