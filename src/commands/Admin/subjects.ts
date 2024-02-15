import { ApplyOptions } from '@sapphire/decorators';
import { PermissionsBitField } from 'discord.js';
import pupa from 'pupa';
import { subjects as config } from '@/config/commands/admin';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'test', chatInputRun: 'test' },
    { name: 'refresh', chatInputRun: 'refresh' },
  ],
})
export class SetupCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addSubcommand(
          subcommand => subcommand
            .setName('test')
            .setDescription(this.descriptions.subcommands.test),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('refresh')
            .setDescription(this.descriptions.subcommands.refresh),
        ),
    );
  }

  public async test(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const errors = await this.container.client.subjectsManager.validate();
    if (errors.length === 0) {
      await interaction.followUp(this.messages.validationSuccess);
    } else {
      await interaction.followUp(pupa(this.messages.validationErrors, {
        errors: errors
          .sort((a, b) => a.row - b.row)
          .map(err => pupa(this.messages.errorLine, {
            row: err.row,
            error: this.messages.errors[err.error],
          }))
          .join('\n'),
      }));
    }
  }

  public async refresh(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const errors = await this.container.client.subjectsManager.validate();
    if (errors.length === 0) {
      await this.container.client.subjectsManager.refresh();
      await interaction.followUp(this.messages.refreshSuccess);
    } else {
      await interaction.followUp(pupa(this.messages.validationErrors, {
        errors: errors
          .sort((a, b) => a.row - b.row)
          .map(err => pupa(this.messages.errorLine, {
            row: err.row,
            error: this.messages.errors[err.error],
          }))
          .join('\n'),
      }));
    }
  }
}
