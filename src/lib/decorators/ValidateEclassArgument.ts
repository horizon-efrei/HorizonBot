import { container } from '@sapphire/framework';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import Eclass from '@/models/eclass';
import type { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { EclassStatus } from '@/types/database';
import { ConfigEntriesRoles } from '@/types/database';

interface ValidationOptions {
  statusIn?: EclassStatus[];
}

export default function ValidateEclassArgument(options?: ValidationOptions): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
      // Get the class ID
      const classId = interaction.options.getString('id');

      // Fetch the class document from the database
      const eclass = await Eclass.findOne({ classId });
      if (!eclass) {
        await interaction.reply({ content: config.messages.invalidClassId, ephemeral: true });
        return;
      }

      // Check if the professor is the right one
      const staffRole = await container.client.configManager.get(ConfigEntriesRoles.Staff, interaction.guild.id);
      if (interaction.member.id !== eclass.professorId
        && staffRole
        && !interaction.member.roles.cache.has(staffRole.id)) {
        await interaction.reply({ content: config.messages.editUnauthorized, ephemeral: true });
        return;
      }

      if (options?.statusIn && options.statusIn.length > 0 && !options.statusIn.includes(eclass.status)) {
        await interaction.reply({
          content: pupa(config.messages.statusIncompatible, { status: eclass.getStatus() }),
          ephemeral: true,
        });
        return;
      }

      Reflect.apply(originalMethod, this, [interaction, eclass]);
    };

    return descriptor;
  };
}
