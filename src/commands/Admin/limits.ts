import { ApplyOptions } from '@sapphire/decorators';
import { GuildLimits } from '@sapphire/discord-utilities';
import { PermissionsBitField } from 'discord.js';
import pupa from 'pupa';
import { limits as config } from '@/config/commands/admin';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

@ApplyOptions<HorizonCommand.Options>(config)
export class LimitsCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    await interaction.reply(pupa(this.messages.limits, {
      channels: interaction.guild.channels.cache.size,
      roles: interaction.guild.roles.cache.size,
      channelsLeft: GuildLimits.MaximumChannels - interaction.guild.channels.cache.size,
      rolesLeft: GuildLimits.MaximumRoles - interaction.guild.roles.cache.size,
    }));
  }
}
