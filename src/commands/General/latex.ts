import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
import {
 ActionRowBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import sharp from 'sharp';
import { latex as config } from '@/config/commands/general';
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

function findError(node: any, attribute: string): string | null {
  if (node.attributes?.[attribute])
    return node.attributes[attribute];

  if (node.children) {
    for (const child of node.children) {
      if (child.kind === 'defs')
continue;

      const result = findError(child, attribute);
      if (result)
        return result;
    }
  }

  return null;
}

@ApplyOptions<HorizonCommand.Options>(config)
export class LatexCommand extends HorizonCommand<typeof config> {
  private readonly _mathJax: any = require('mathjax').init({
    loader: {
      load: [
        'input/tex',
        'output/svg',
        '[tex]/ams',
        '[tex]/color',
        '[tex]/mathtools',
        '[tex]/physics',
        '[tex]/unicode',
        '[tex]/textmacros',
      ],
    },
    tex: { packages: { '[+]': ['ams', 'color', 'mathtools', 'physics', 'unicode', 'textmacros'] } },
  }).then((readyMJ: object) => {
    // Explicitement bypass le readonly et effectivement faire un await dans à l'initialisation
    (this as any)._mathJax = readyMJ;
  });

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
      await this._tryToGenerate(replyTo, equation, 0);
    } catch (e) {
      if (e instanceof EvalError) {
        await replyTo.reply({
          content: "Ça n'a pas l'air d'être une équation valide ! Le message d'erreur LaTeX est :\n"
            + `\`${e.message}\``,
          ephemeral: true,
        });
      } else {
        await replyTo.reply({
          content: "L'image de la formule n'a pas pu être générée.",
          ephemeral: true,
        });
      }
    }
  }

  private async _parseAndGenerate(equation: string): Promise<Buffer> {
    const svg = this._mathJax.tex2svg(equation, { display: true }).children[0];

    const svgText: string = this._mathJax.startup.adaptor.outerHTML(svg);

    // MathJax ne renvoie pas d'erreur si l'équation est invalide, il faut donc vérifier nous-même
    const svgError = findError(svg, 'data-mjx-error');
    if (svgError)
      throw new EvalError(svgError);

    return sharp(Buffer.from(svgText))
      .resize({ width: Math.min(Math.floor(6 * equation.length), 1024) })
      .extend({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
        background: '#FFF',
      }) // Padding
      .flatten({ background: '#FFF' }) // Arrière-plan de couleur
      .toBuffer();
  }

  private async _tryToGenerate(replyTo: CommandInteraction<'cached'> | ModalSubmitInteraction<'cached'>, equation: string, attempt: number): Promise<void> {
    if (attempt > 3)
      throw new Error('MathJax retry limit reached');

    try {
      const result = await this._parseAndGenerate(equation);
      await replyTo.reply({ files: [new AttachmentBuilder(result).setName('output.png')] });
    } catch (e) {
      if (e.toString().includes('MathJax retry'))
        await this._tryToGenerate(replyTo, equation, attempt + 1);
      else
        throw e;
    }
  }
}
