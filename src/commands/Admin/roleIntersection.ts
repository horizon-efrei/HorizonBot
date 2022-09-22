import { ApplyOptions } from '@sapphire/decorators';
import { filterNullAndUndefined } from '@sapphire/utilities';
import { Permissions } from 'discord.js';
import pupa from 'pupa';
import { roleIntersection as config } from '@/config/commands/admin';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Persistent = 'persistant',
  Role1 = 'role1',
  Role2 = 'role2',
  Role3 = 'role3',
  Role4 = 'role4',
  Role5 = 'role5',
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class RoleIntersectionCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    const roleDescription = this.descriptions.options.role;

    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD)
        .setDMPermission(false)
        .addRoleOption(option => option.setName(Options.Role1).setDescription(roleDescription).setRequired(true))
        .addRoleOption(option => option.setName(Options.Role2).setDescription(roleDescription).setRequired(true))
        .addRoleOption(option => option.setName(Options.Role3).setDescription(roleDescription))
        .addRoleOption(option => option.setName(Options.Role4).setDescription(roleDescription))
        .addRoleOption(option => option.setName(Options.Role5).setDescription(roleDescription))
        .addBooleanOption(
          option => option
            .setName(Options.Persistent)
            .setDescription(this.descriptions.options.persistent),
        ),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    const isPersistent = interaction.options.getBoolean(Options.Persistent);

    const allRoles = [
      interaction.options.getRole(Options.Role1, true),
      interaction.options.getRole(Options.Role2, true),
      interaction.options.getRole(Options.Role3),
      interaction.options.getRole(Options.Role4),
      interaction.options.getRole(Options.Role5),
    ].filter(filterNullAndUndefined);

    const members = await interaction.guild.members.fetch({ force: true });
    const targetedMembers = members
      .filter(member => allRoles.every(role => member.roles.cache.has(role.id)));

    if (targetedMembers.size === 0) {
      await interaction.reply({
        content: pupa(this.messages.noTargetedUsers, { num: allRoles.length }),
        ephemeral: true,
      });
      return;
    }

    const newRole = await interaction.guild.roles.create({
      name: allRoles.map(r => r.name).join(' + '),
      hoist: false,
      mentionable: true,
      reason: `${interaction.member.displayName} a exécuté la commande RoleIntersection`,
    });

    for (const member of targetedMembers.values())
      await member.roles.add(newRole);

    await interaction.reply(
      pupa(
        isPersistent ? this.messages.successPersistent : this.messages.successTemporary,
        { newRole, targetedMembers },
      ),
    );

    if (!isPersistent)
      this.container.client.roleIntersections.add(newRole.id);
  }
}
