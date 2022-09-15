import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandType } from 'discord-api-types/v10';
import { Permissions } from 'discord.js';
import { flagMessage as config } from '@/config/commands/moderation';
import FlaggedMessage from '@/structures/FlaggedMessage';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<HorizonCommand.Options>(config)
export default class FlagMessageCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerContextMenuCommand(
      command => command
        .setName(this.descriptions.name)
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_MESSAGES)
        .setDMPermission(false),
    );
  }

  public override async contextMenuRun(interaction: HorizonCommand.ContextMenuInteraction<'cached'>): Promise<void> {
    if (!interaction.channel)
      return;

    await interaction.deferReply();

    const message = await interaction.channel.messages.fetch(interaction.targetId) as GuildMessage;
    if (!message) {
      await interaction.reply({ content: this.messages.messageNotFound, ephemeral: true });
      return;
    }

    await new FlaggedMessage(message, interaction.member).start();

    await interaction.followUp({ content: this.messages.success, ephemeral: true });
  }
}
