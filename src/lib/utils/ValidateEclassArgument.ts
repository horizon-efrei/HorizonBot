/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import type { Args } from '@sapphire/framework';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import type { GuildMessage } from '@/types';
import type { EclassDocument } from '@/types/database';
import { EclassStatus } from '@/types/database';

interface ValidationOptions {
  statusIn: EclassStatus[];
}

function toStatus(eclass: EclassDocument): string {
  switch (eclass.status) {
    case EclassStatus.Planned: return config.messages.statuses.planned;
    case EclassStatus.InProgress: return config.messages.statuses.inProgress;
    case EclassStatus.Finished: return config.messages.statuses.finished;
    case EclassStatus.Canceled: return config.messages.statuses.canceled;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ValidateEclassArgument(options: ValidationOptions) {
  return (_target: Object, _key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
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

      if (!options.statusIn.includes(eclass.status)) {
        await message.channel.send(
          pupa(config.messages.statusIncompatible, { status: toStatus(eclass) }),
        );
        return;
      }


      Reflect.apply(originalMethod, this, [message, args, eclass]);
    };

    return descriptor;
  };
}
