
import type { Args } from '@sapphire/framework';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import type { GuildMessage } from '@/types';
import type { EclassDocument } from '@/types/database';

interface EprofOrStaffOptions {
  isOriginalEprof?: boolean;
}

export default function IsEprofOrStaff(options?: EprofOrStaffOptions): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args, eclass?: EclassDocument): Promise<void> {
      if (!eclass && options.isOriginalEprof)
        throw new TypeError('The third argument of IsEprofOrStaff is required if Options.isOriginalEprof is true. This likely mean you forgot the ValidateEclassArgument decorator.');

      const staffRolePosition = message.guild.roles.cache.get(settings.roles.staff).position;
      const userHighestRolePosition = message.member.roles.highest.position;
      // Check if the user is a staff member or better
      if (userHighestRolePosition >= staffRolePosition) {
        Reflect.apply(originalMethod, this, [message, args, eclass]);
        return;
      }

      // Check if the user is not an eprof
      if (!message.member.roles.cache.has(settings.roles.eprofs.global)) {
        await message.channel.send(config.messages.onlyProfessor);
        return;
      }

      // Check if the professor is the right one
      if (options?.isOriginalEprof && message.member.id !== eclass.professor) {
        await message.channel.send(config.messages.editUnauthorized);
        return;
      }

      Reflect.apply(originalMethod, this, [message, args, eclass]);
    };

    return descriptor;
  };
}
