import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { latex as config } from '@/config/commands/general';
import { settings } from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Equation = 'equation',
}

const equationModal = new ModalBuilder()
  .setTitle(config.messages.equationModal.title)
  .setCustomId('equation-modal')
  .addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setLabel(config.messages.equationModal.textInput.label)
        .setPlaceholder(config.messages.equationModal.textInput.placeholder)
        .setStyle(TextInputStyle.Paragraph)
        .setCustomId('equation')
        .setRequired(true),
    ),
  );

@ApplyOptions<HorizonCommand.Options>(config)
export class LatexCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(true)
        .addStringOption(
          option => option
            .setName(Options.Equation)
            .setRequired(false)
            .setDescription(this.descriptions.options.equation),
        ),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    let replyTo: CommandInteraction<'cached'> | ModalSubmitInteraction<'cached'> = interaction;

    let equation = interaction.options.getString(Options.Equation);
    if (!equation) {
      // Show a modal with a text input
      await interaction.showModal(equationModal);
      const submit = await interaction.awaitModalSubmit({
        filter: int => int.isModalSubmit()
          && int.inCachedGuild()
          && int.customId === 'equation-modal'
          && int.member.id === interaction.member.id,
        time: 900_000, // 15 minutes
      });

      replyTo = submit;
      equation = submit.fields.getTextInputValue('equation');
    }
    await replyTo.reply(settings.apis.latex + encodeURIComponent(equation));
  }
}
