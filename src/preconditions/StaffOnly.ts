import type { PreconditionResult } from '@sapphire/framework';
import { Identifiers, Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';
import settings from '@/config/settings';

export default class StaffOnlyPrecondition extends Precondition {
  public run(message: Message): PreconditionResult {
    const staffRolePosition = message.guild.roles.cache.get(settings.roles.staff).position;
    const userHighestRolePosition = message.member.roles.highest.position;

    if (userHighestRolePosition >= staffRolePosition)
      return this.ok();
    return this.error({ identifier: Identifiers.PreconditionStaffOnly, message: 'You cannot run this command without the "Staff" role.' });
  }
}
