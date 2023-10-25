import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
import {
  ActionRowBuilder, AttachmentBuilder, ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { latex as config } from '@/config/commands/general';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Equation = 'equation',
  BG_COLOR = "#FFF"
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

    try {
      const MathJax = await require("mathjax").init({
        loader: { load: ['input/tex', 'output/svg'] }
      });

      const svg = await MathJax.tex2svg(equation, {display: true}).children[0];
      const sharp = require("sharp");

      sharp(Buffer.from(MathJax.startup.adaptor.outerHTML(svg)))
        .resize({width: 1024}) // sinon l'image est trop petite et pixellisée
        .extend({top: 50, bottom: 50, left: 50, right: 50, background: Options.BG_COLOR}) // padding
        .flatten({background: Options.BG_COLOR}) // arrière-plan de couleur
        .toBuffer()
        .then((data: any) => {
          replyTo.reply({files: [new AttachmentBuilder(data).setName("output.png")]});
        })
        .catch((err: any) => {
          console.error(err);
          replyTo.reply({ content: "Une erreur est survenue lors de la génération de l'image.", ephemeral: true });
        });

    } catch (e) {
      if (e.toString().includes("MathJax retry")) {
        console.log(e)
        await replyTo.reply({ content: "Je vous prie de retenter votre commande.", ephemeral: true });
      } else {
        await replyTo.reply({ content: "Ça n'a pas l'air d'être une équation valide !", ephemeral: true });
      }
    }

  }
}
