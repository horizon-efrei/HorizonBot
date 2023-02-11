import { Listener } from '@sapphire/framework';
import type { Role } from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getRoleSnapshot } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

export default class RoleUpdateListener extends Listener {
  public async run(oldRole: Role, newRole: Role): Promise<void> {
    if (oldRole.name !== newRole.name
      || oldRole.hexColor !== newRole.hexColor
      || oldRole.hoist !== newRole.hoist
      || oldRole.mentionable !== newRole.mentionable
      || oldRole.managed !== newRole.managed
      || oldRole.position !== newRole.position
      || !oldRole.permissions.equals(newRole.permissions)) {
      const auditLogs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate }).catch(nullop);
      const lastRoleCreate = auditLogs?.entries
        .filter(entry => entry.target?.id === newRole.id && entry.createdTimestamp > Date.now() - 2000)
        .first();

      await DiscordLogManager.logAction({
        type: DiscordLogType.RoleUpdate,
        context: {
          roleId: newRole.id,
          executorId: lastRoleCreate?.executor?.id,
        },
        content: {
          before: getRoleSnapshot(oldRole),
          after: getRoleSnapshot(newRole),
        },
        guildId: newRole.guild.id,
        severity: 1,
      });
    }
  }
}
