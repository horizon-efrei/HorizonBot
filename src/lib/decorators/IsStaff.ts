import type { Args, CommandDeniedPayload } from '@sapphire/framework';
import {
  container,
  Events,
  Identifiers,
  PreconditionError,
} from '@sapphire/framework';
import type { GuildMessage } from '@/types';
import { ConfigEntriesRoles } from '@/types/database';

const precondition = container.stores.get('preconditions').get('StaffOnly');

export default function IsStaff(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args): Promise<void> {
      const staffRole = await container.client.configManager.get(ConfigEntriesRoles.Staff, message.guild.id);
      const userHighestRolePosition = message.member.roles.highest.position;
      // Check if the user is a staff member or better
      if (userHighestRolePosition >= staffRole.position) {
        Reflect.apply(originalMethod, this, [message, args]);
      } else {
        const payload: CommandDeniedPayload = {
          command: args.command,
          message,
          context: args.commandContext,
          parameters: null,
        };
        const error = new PreconditionError({ precondition, identifier: Identifiers.PreconditionStaffOnly });
        container.client.emit(Events.CommandDenied, error, payload);
      }
    };

    return descriptor;
  };
}
