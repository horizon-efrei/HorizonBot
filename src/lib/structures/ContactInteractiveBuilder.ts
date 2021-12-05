import {
  Constants,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js';
import type { Message, MessageComponentInteraction } from 'discord.js';
import { MessageComponentTypes } from 'discord.js/typings/enums';
import pupa from 'pupa';
import type { A } from 'ts-toolbelt';
import type { ContactBase, ContactDocument } from '../types/database';
import { contact as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Contact from '@/models/contact';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage, PrompterText } from '@/types';
import { capitalize, noop } from '@/utils';

const getTeamsMenu = (teams: string[]): MessageSelectMenu => new MessageSelectMenu()
  .setCustomId('select-team')
  .setPlaceholder(config.messages.createContactSetup.teamMenu.placeholder)
  .addOptions(teams.map(team => capitalize(team)).map(team => ({ label: team, value: team, emoji: '🏷' })));

export default class ContactInteractiveBuilder {
  public step = 0;
  public mainBotMessage: Message;
  public botMessagePrompt: GuildMessage;
  public prompter: ArgumentPrompter;
  public aborted = false;
  public responses = {
    name: null,
    contact: null,
    team: null,
    description: null,
  } as ContactBase;

  private readonly _userResponses = new Set<GuildMessage>();
  private readonly _actionRows = [
    new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('abort')
          .setLabel(config.messages.createContactSetup.abortMenu.label)
          .setStyle(Constants.MessageButtonStyles.DANGER),
      ),
  ];

  constructor(public message: GuildMessage) {}

  private get _embed(): MessageEmbed {
    return new MessageEmbed()
      .setColor(settings.colors.default)
      .setTitle(config.messages.createContactSetup.embed.title)
      .setDescription(config.messages.createContactSetup.embed.description)
      .addField(config.messages.createContactSetup.embed.stepPreviewTitle, this._buildStepsPreview())
      .addField(
        pupa(config.messages.createContactSetup.embed.currentStepTitle, { step: this.step + 1 }),
        config.messages.createContactSetup.embed.currentStepDescription[this.step],
      );
  }

  public async start(): Promise<ContactBase | null> {
    this.mainBotMessage = await this.message.channel.send({ embeds: [this._embed], components: this._actionRows });
    this.botMessagePrompt = await this.message.channel.send(config.messages.prompts.name.base) as GuildMessage;

    this.prompter = new ArgumentPrompter(this.message, {
      messageArray: this._userResponses,
      baseMessage: this.botMessagePrompt,
    });

    const collector = this.mainBotMessage.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
    }).on('collect', async (interaction) => {
      if (interaction.customId === 'abort')
        await this._abort(config.messages.prompts.stoppedPrompting, interaction);
    });

    try {
      await this._askPrompts();
    } catch (err: unknown) {
      if (this.aborted)
        return;

      // FIXME: Bruh this error management is so disgusting it makes me wanna throw please refactor that ASAP
      if (err instanceof Error && (err.name.includes('INTERACTION_COLLECTOR_ERROR') || err.message === 'TIME OUT')) {
        await this._abort(config.messages.prompts.promptTimeout);
        return;
      }

      if (err instanceof Error && err.message === 'STOP') {
        await this._abort(config.messages.prompts.stoppedPrompting);
        return;
      }

      const details = err instanceof Error ? err.message
        : typeof err === 'string' ? err
        : JSON.stringify(err);

      await this._abort(pupa(config.messages.createContactSetup.error, { details }));
      throw err;
    } finally {
      collector.stop();
    }

    if (this.aborted)
      return;

    await this.mainBotMessage.edit({
      embeds: [this._embed.setColor(settings.colors.green).spliceFields(1, 1)],
      components: [],
    });
    await this.botMessagePrompt?.delete();
    return this.responses;
  }

  private async _askPrompts(): Promise<void> {
    // 1. Ask for the contact's name
    this.responses.name = await this._makeMessageStep('autoPromptText', config.messages.prompts.name);
    await this._updateStep();

    // 2. Ask for the contact
    this.responses.contact = await this._makeMessageStep('autoPromptText', config.messages.prompts.contact);
    await this._updateStep();

    // 2. Ask for the team's name
    const teamDocuments = await Contact.find().select('team') as Array<Pick<ContactDocument, '_id' | 'team'>>;
    const teams = [...new Set(teamDocuments.map(teamDoc => teamDoc.team))];

    if (teams.length === 0) {
      this.responses.team = await this._makeMessageStep('autoPromptText', config.messages.prompts.team);
      await this._updateStep();
    } else {
      const teamMenu = getTeamsMenu(teams);
      const teamResult = await this._makeSelectMenuOrMessageStep(teamMenu, 'autoPromptText', config.messages.prompts.team);
      if (teamResult instanceof SelectMenuInteraction) {
        this.responses.team = teamResult.values.shift();
        await this._updateStep(teamResult);
      } else {
        this.responses.team = teamResult;
        await this._updateStep();
      }
    }

    // 4. Ask for the description
    this.responses.description = await this._makeMessageStep('autoPromptText', config.messages.prompts.description);
    await this._updateStep();
  }

  private async _makeMessageStep<
    Key extends keyof ArgumentPrompter,
    TResult extends A.Await<ReturnType<ArgumentPrompter[Key]>>,
  >(
    prompter: Key,
    prompts: PrompterText,
    validator = (_resolved: TResult): boolean => true,
  ): Promise<TResult> {
    let result: TResult;
    let previousIsFailure = false;
    do {
      result = await this.prompter[prompter](prompts, previousIsFailure) as TResult;
      if (this.aborted)
        return;

      previousIsFailure = true;
      for (const response of this._userResponses) {
        if (!response.author.bot) {
          await response.delete().catch(noop);
          this._userResponses.delete(response);
        }
      }
    } while (!validator(result));

    return result;
  }

  private async _makeSelectMenuOrMessageStep<
    Key extends keyof ArgumentPrompter,
    TResult extends A.Await<ReturnType<ArgumentPrompter[Key]>>,
  >(
    component: MessageSelectMenu,
    prompter: Key,
    prompts: PrompterText,
  ): Promise<SelectMenuInteraction | TResult> {
    // Setup MessageSelectMenu
    this._actionRows.push(new MessageActionRow().addComponents([component]));
    await this.mainBotMessage.edit({ components: this._actionRows });

    const messageComponentCollectorPromise = this.mainBotMessage.awaitMessageComponent({
      componentType: component.type,
      time: 2 * 60 * 1000,
      filter: i => i.user.id === this.message.author.id && i.customId === component.customId && !this.aborted,
    });

    // Setup MessagePrompt
    const messagePrompterCollectorPromise = this.prompter[prompter](prompts) as Promise<TResult>;

    // Await both
    const result = await Promise.race([
      messageComponentCollectorPromise,
      messagePrompterCollectorPromise,
    ]);
    if (this.aborted)
      return;

    // Unsetup MessageSelectMenu
    this._actionRows.splice(1);

    // Unsetup MessagePrompt
    for (const response of this._userResponses) {
      if (!response.author.bot) {
        await response.delete().catch(noop);
        this._userResponses.delete(response);
      }
    }

    return result;
  }

  private async _updateStep(interaction?: MessageComponentInteraction): Promise<void> {
    this.step++;
    // eslint-disable-next-line unicorn/prefer-ternary
    if (interaction)
      await interaction.update({ embeds: [this._embed], components: this._actionRows });
    else
      await this.mainBotMessage.edit({ embeds: [this._embed], components: this._actionRows });
  }

  private async _abort(text: string, interaction?: MessageComponentInteraction): Promise<void> {
    this.aborted = true;
    this.prompter.terminate();
    await this.botMessagePrompt.edit(text);

    // eslint-disable-next-line unicorn/prefer-ternary
    if (interaction)
      await interaction.update({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
    else
      await this.mainBotMessage.edit({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
  }

  private _buildStepsPreview(): string {
    return pupa(config.messages.createContactSetup.stepPreview, {
      name: this.responses.name ?? this._emoteForStep(0),
      contact: this.responses.contact ?? this._emoteForStep(1),
      team: this.responses.team ?? this._emoteForStep(2),
      description: this.responses.description ?? this._emoteForStep(3),
    });
  }

  private _emoteForStep(index: number): string {
    return this.step === index ? ':gear:' : ':question:';
  }
}
