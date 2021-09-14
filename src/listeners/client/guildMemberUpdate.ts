import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';
import type { GuildMemberRoleUpdateAuditLogs } from '@/types/discord-js';

export default class GuildMemberUpdateListener extends Listener {
  public async run(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    if (oldRoles.equals(newRoles))
      return;

    const addedRoles = [...newRoles.filter(role => !oldRoles.has(role.id)).keys()];
    const removedRoles = [...oldRoles.filter(role => !newRoles.has(role.id)).keys()];

    const auditLogs = await newMember.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE' }) as GuildMemberRoleUpdateAuditLogs;
    const lastMemberUpdate = auditLogs.entries.filter(entry => entry.target.id === newMember.id).first();

    if (addedRoles.length > 0) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.RoleAdd,
        context: {
          executorId: lastMemberUpdate.executor.id,
          userId: newMember.id,
        },
        content: addedRoles,
        guildId: newMember.guild.id,
        severity: 1,
      });
    }

    if (removedRoles.length > 0) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.RoleRemove,
        context: {
          executorId: lastMemberUpdate.executor.id,
          userId: newMember.id,
        },
        content: removedRoles,
        guildId: newMember.guild.id,
        severity: 1,
      });
    }
  }
}
