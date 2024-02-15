import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
import {
 ActionRowBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
// @ts-expect-error: MathJax doesn't have types
import { init as initMathJax } from 'mathjax';
import pupa from 'pupa';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // FIXME: move to top-level await when supported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _mathJax: any = initMathJax({
    loader: {
      load: [
        'input/tex',
        'output/svg',
        '[tex]/color',
        '[tex]/mathtools',
        '[tex]/physics',
        '[tex]/unicode',
        '[tex]/textmacros',
      ],
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tex: { packages: { '[+]': ['ams', 'color', 'mathtools', 'physics', 'unicode', 'textmacros'] } },
    // eslint-disable-next-line unicorn/consistent-function-scoping
  }).then((readyMJ: object) => {
    // Explicitly bypass the readonly to effectively use an await at the initialization of MathJax
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const result = await this._tryToGenerate(equation);
      await replyTo.reply({ files: [new AttachmentBuilder(result).setName('output.png')] });
    } catch (e) {
      if (e instanceof EvalError) {
        await replyTo.reply({
          content: pupa(this.messages.invalidEquation, { msg: e.message }),
          ephemeral: true,
        });
      } else {
        await replyTo.reply({
          content: this.messages.genericError,
          ephemeral: true,
        });
      }
    }
  }

  private async _parseAndGenerate(equation: string): Promise<Buffer> {
    const svg = this._mathJax.tex2svg(equation, { display: true }).children[0];

    const svgText: string = this._mathJax.startup.adaptor.outerHTML(svg);

    // MathJax doesn't return an error if the equation is invalid, so we have to check ourselves
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
      .flatten({ background: '#FFF' }) // Colored background
      .toBuffer();
  }

  private async _tryToGenerate(equation: string, attempt = 0): Promise<Buffer> {
    if (attempt > 3)
      throw new Error('MathJax retry limit reached');

    try {
      return this._parseAndGenerate(equation);
    } catch (e) {
      if (e.toString().includes('MathJax retry'))
        return this._tryToGenerate(equation, attempt + 1);

      throw e;
    }
  }
}
