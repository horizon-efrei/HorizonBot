import type { Args } from '@sapphire/framework';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import type { GuildMessage } from '@/types';
import type { EclassStatus } from '@/types/database';

interface ValidationOptions {
  statusIn?: EclassStatus[];
}

export default function ValidateEclassArgument(options?: ValidationOptions): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args): Promise<void> {
      // Get the class ID
      const classId = await args.pickResult('string');
      if (classId.error) {
        await message.channel.send(config.messages.invalidClassId);
        return;
      }

      // Fetch the class document from the database
      const eclass = await Eclass.findOne({ classId: classId.value });
      if (!eclass) {
        await message.channel.send(config.messages.invalidClassId);
        return;
      }

      // Check if the professor is the right one
      if (message.member.id !== eclass.professor && !message.member.roles.cache.has(settings.roles.staff)) {
        await message.channel.send(config.messages.editUnauthorized);
        return;
      }

      if (options?.statusIn.length > 0 && !options.statusIn.includes(eclass.status)) {
        await message.channel.send(
          pupa(config.messages.statusIncompatible, { status: eclass.getStatus() }),
        );
        return;
      }


      Reflect.apply(originalMethod, this, [message, args, eclass]);
    };

    return descriptor;
  };
}
