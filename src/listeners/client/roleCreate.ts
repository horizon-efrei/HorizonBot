import { Listener } from '@sapphire/framework';
import type { Role } from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getRoleSnapshot } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

export class RoleCreateListener extends Listener {
  public async run(role: Role): Promise<void> {
    const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate }).catch(nullop);
    const lastRoleCreate = auditLogs?.entries
      .filter(entry => entry.target?.id === role.id && entry.createdTimestamp > Date.now() - 2000)
      .first();

    await DiscordLogManager.logAction({
      type: DiscordLogType.RoleCreate,
      context: {
        roleId: role.id,
        executorId: lastRoleCreate?.executor?.id,
      },
      content: getRoleSnapshot(role),
      guildId: role.guild.id,
      severity: 1,
    });
  }
}
