import type { AsyncPreconditionResult } from '@sapphire/framework';
import { Identifiers, Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ConfigEntriesRoles } from '@/types/database';
import { isGuildMessage } from '@/utils';

export default class StaffOnlyPrecondition extends Precondition {
  public async run(message: Message): AsyncPreconditionResult {
    if (!isGuildMessage(message))
      return this.error({ identifier: Identifiers.PreconditionGuildOnly, message: 'You cannot run this command in DMs.' });

    if (message.member.permissions.has('ADMINISTRATOR'))
      return this.ok();

    const staffRole = await this.container.client.configManager.get(ConfigEntriesRoles.Staff, message.guild.id);
    if (!staffRole)
      this.container.logger.warn('[StaffOnly] A staff-only command was run, but no staff role was defined. Do so with "!setup set role-staff @Staff"');
    const userHighestRolePosition = message.member.roles.highest.position;

    if (userHighestRolePosition >= staffRole?.position)
      return this.ok();
    return this.error({ identifier: Identifiers.PreconditionStaffOnly, message: 'You cannot run this command without the "Staff" role.' });
  }
}
