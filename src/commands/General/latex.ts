import {ApplyOptions} from '@sapphire/decorators';
import type {CommandInteraction, ModalSubmitInteraction} from 'discord.js';
import {ActionRowBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,} from 'discord.js';
import {latex as config} from '@/config/commands/general';
import {HorizonCommand} from '@/structures/commands/HorizonCommand';
import sharp from "sharp";

enum Options {
  Equation = 'equation'
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

function findError(node: any, attribute: string): string | null {
  if (node.attributes && node.attributes[attribute]) {
    return node.attributes[attribute];
  }

  if (node.children) {
    for (const child of node.children) {
      if (child.kind === "defs") continue;

      const result = findError(child, attribute);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

@ApplyOptions<HorizonCommand.Options>(config)
export class LatexCommand extends HorizonCommand<typeof config> {
  private MathJax: any = require("mathjax").init({
    loader: { load: ['input/tex', 'output/svg'] }
  });

  private async parseAndGenerate(equation: string): Promise<Buffer> {
    const svg = (await this.MathJax).tex2svg(equation, {display: true}).children[0];

    const svgText = (await this.MathJax).startup.adaptor.outerHTML(svg);

    // MathJax ne renvoie pas d'erreur si l'équation est invalide, il faut donc vérifier nous-même
    const svgError = findError(svg, "data-mjx-error");
    if (svgError)
      throw new EvalError(svgError);

    return sharp(Buffer.from(svgText))
      .resize({width: 1024}) // sinon l'image est trop petite et pixellisée
      .extend({top: 40, bottom: 40, left: 40, right: 40, background: "#FFF"}) // padding
      .flatten({background: "#FFF"}) // arrière-plan de couleur
      .toBuffer();
  }

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

  private async tryToGenerate(replyTo: CommandInteraction<"cached"> | ModalSubmitInteraction<"cached">, equation: string, attempt: number): Promise<void> {
    if (attempt > 3)
      throw new Error("MathJax retry limit reached");

    try {
      const result = await this.parseAndGenerate(equation);
      await replyTo.reply({files: [new AttachmentBuilder(result).setName("output.png")]});
    }
    catch (e) {
      if (e.toString().includes("MathJax retry"))
        await this.tryToGenerate(replyTo, equation, attempt + 1);
      else
        throw e;
    }
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
      await this.tryToGenerate(replyTo, equation, 0);
    } catch (e) {
      if (e instanceof EvalError) {
        await replyTo.reply({
          content: "Ça n'a pas l'air d'être une équation valide ! Le message d'erreur LaTeX est :\n" +
            `\`${e.message}\``,
          ephemeral: true
        });
      } else {
        await replyTo.reply({
          content: "L'image de la formule n'a pas pu être générée.",
          ephemeral: true
        });
      }
    }

  }
}
