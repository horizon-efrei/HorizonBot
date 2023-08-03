import { container } from '@sapphire/framework';
import { eclass as config } from '@/config/commands/professors';
import type { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import type { EclassDocument } from '@/types/database';
import { ConfigEntriesRoles } from '@/types/database';

interface EprofOrStaffOptions {
  isOriginalEprof?: boolean;
}

export function IsEprofOrStaff(options?: EprofOrStaffOptions): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (interaction: HorizonSubcommand.ChatInputInteraction<'cached'>, eclass?: EclassDocument): Promise<void> {
      if (!eclass && options?.isOriginalEprof)
        throw new TypeError('The third argument of IsEprofOrStaff is required if Options.isOriginalEprof is true. This likely mean you forgot the ValidateEclassArgument decorator.');

      const staffRole = await container.client.configManager.get(ConfigEntriesRoles.Staff, interaction.guild.id);
      const userHighestRolePosition = interaction.member.roles.highest.position;
      // Check if the user is a staff member or better
      if (staffRole && userHighestRolePosition >= staffRole.position) {
        Reflect.apply(originalMethod, this, [interaction, eclass]);
        return;
      }

      // Check if the user is not an eprof
      const eprofRole = await container.client.configManager.get(ConfigEntriesRoles.Eprof, interaction.guild.id);
      if (eprofRole && !interaction.member.roles.cache.has(eprofRole.id)) {
        await interaction.reply(config.messages.onlyProfessor);
        return;
      }

      // Check if the professor is the right one
      if (options?.isOriginalEprof && interaction.member.id !== eclass!.professorId) {
        await interaction.reply(config.messages.editUnauthorized);
        return;
      }

      Reflect.apply(originalMethod, this, [interaction, eclass]);
    };

    return descriptor;
  };
}
