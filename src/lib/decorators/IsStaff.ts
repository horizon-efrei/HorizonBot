import type { Args, CommandDeniedPayload } from '@sapphire/framework';
import {
  container,
  Events,
  Identifiers,
  PreconditionError,
} from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ConfigEntriesRoles } from '@/types/database';
import { isGuildMessage } from '@/utils';

const guildPrecondition = container.stores.get('preconditions').get('GuildOnly');
const staffPrecondition = container.stores.get('preconditions').get('StaffOnly');

export default function IsStaff(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: Message, args: Args): Promise<void> {
      const preconditionErrorPayload: CommandDeniedPayload = {
        command: args.command,
        message,
        context: args.commandContext,
        parameters: null,
      };

      if (!isGuildMessage(message)) {
        const error = new PreconditionError({
          precondition: guildPrecondition,
          identifier: Identifiers.PreconditionGuildOnly,
        });
        container.client.emit(Events.CommandDenied, error, preconditionErrorPayload);
        return;
      }

      const staffRole = await container.client.configManager.get(ConfigEntriesRoles.Staff, message.guild.id);
      const userHighestRolePosition = message.member.roles.highest.position;
      // Check if the user is a staff member or better
      if (userHighestRolePosition >= staffRole.position) {
        Reflect.apply(originalMethod, this, [message, args]);
      } else {
        const error = new PreconditionError({
          precondition: staffPrecondition,
          identifier: Identifiers.PreconditionStaffOnly,
        });
        container.client.emit(Events.CommandDenied, error, preconditionErrorPayload);
      }
    };

    return descriptor;
  };
}
