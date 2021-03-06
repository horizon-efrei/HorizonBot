import {
  Constants,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import type { BaseGuildVoiceChannel, Message, SelectMenuInteraction } from 'discord.js';
import { MessageComponentTypes } from 'discord.js/typings/enums';
import pupa from 'pupa';
import type { A } from 'ts-toolbelt';
import { subject as config } from '@/config/commands/professors';
import messages from '@/config/messages';
import settings from '@/config/settings';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage, GuildTextBasedChannel, PrompterText } from '@/types';
import { SchoolYear, TeachingUnit } from '@/types';
import { noop } from '@/utils';

const schoolYearMenu = new MessageSelectMenu()
  .setCustomId('select-schoolyear')
  .setPlaceholder(config.messages.createSubjectSetup.schoolYearMenu.placeholder)
  .addOptions([{
      ...config.messages.createSubjectSetup.schoolYearMenu.options[0],
      value: SchoolYear.L1,
    }, {
      ...config.messages.createSubjectSetup.schoolYearMenu.options[1],
      value: SchoolYear.L2,
    }, {
      ...config.messages.createSubjectSetup.schoolYearMenu.options[2],
      value: SchoolYear.L3,
  }]);

const teachingUnitMenu = new MessageSelectMenu()
  .setCustomId('select-teachingunit')
  .setPlaceholder(config.messages.createSubjectSetup.teachingUnitMenu.placeholder)
  .addOptions([{
      ...config.messages.createSubjectSetup.teachingUnitMenu.options[0],
      value: TeachingUnit.GeneralFormation,
    }, {
      ...config.messages.createSubjectSetup.teachingUnitMenu.options[1],
      value: TeachingUnit.Mathematics,
    }, {
      ...config.messages.createSubjectSetup.teachingUnitMenu.options[2],
      value: TeachingUnit.ComputerScience,
    }, {
      ...config.messages.createSubjectSetup.teachingUnitMenu.options[3],
      value: TeachingUnit.PhysicsElectronics,
  }]);

interface SubjectCreationOptions {
  schoolYear: string;
  teachingUnit: TeachingUnit;
  name: string;
  nameEnglish: string;
  classCode: string;
  moodleLink: string;
  textChannel: GuildTextBasedChannel;
  voiceChannel: BaseGuildVoiceChannel;
  textDocsChannel: GuildTextBasedChannel;
  emoji: string;
  emojiImage: string;
}

export default class SubjectInteractiveBuilder {
  public step = 0;
  public mainBotMessage: Message;
  public botMessagePrompt: GuildMessage;
  public prompter: ArgumentPrompter;
  public aborted = false;
  public responses = {
    schoolYear: null,
    teachingUnit: null,
    name: null,
    nameEnglish: null,
    classCode: null,
    moodleLink: null,
    textChannel: null,
    voiceChannel: null,
    textDocsChannel: null,
    emoji: null,
    emojiImage: null,
  } as SubjectCreationOptions;

  private readonly _userResponses = new Set<GuildMessage>();
  private readonly _actionRows = [
    new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('abort')
          .setLabel(config.messages.createSubjectSetup.abortMenu.label)
          .setStyle(Constants.MessageButtonStyles.DANGER),
      ),
  ];

  constructor(public message: GuildMessage) {}

  private get _embed(): MessageEmbed {
    return new MessageEmbed()
      .setColor(settings.colors.default)
      .setTitle(config.messages.createSubjectSetup.embed.title)
      .setDescription(config.messages.createSubjectSetup.embed.description)
      .addField(config.messages.createSubjectSetup.embed.stepPreviewTitle, this._buildStepsPreview())
      .addField(
        pupa(config.messages.createSubjectSetup.embed.currentStepTitle, { step: this.step + 1 }),
        config.messages.createSubjectSetup.embed.currentStepDescription[this.step],
      );
  }

  public async start(): Promise<SubjectCreationOptions | null> {
    this.mainBotMessage = await this.message.channel.send({ embeds: [this._embed], components: this._actionRows });
    this.botMessagePrompt = await this.message.channel.send(
      config.messages.createSubjectSetup.promptMessageDropdown,
    ) as GuildMessage;

    this.prompter = new ArgumentPrompter(this.message, {
      messageArray: this._userResponses,
      baseMessage: this.botMessagePrompt,
    });

    const collector = this.mainBotMessage.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
    }).on('collect', async (interaction) => {
        if (interaction.customId === 'abort') {
          this.aborted = true;
          await interaction.update({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
          await this.botMessagePrompt.edit(config.messages.prompts.stoppedPrompting);
        }
      });

    try {
      await this._askPrompts();
    } catch (err: unknown) {
      if (this.aborted)
        return;

      await this.mainBotMessage.edit({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
      if (err instanceof Error && err.name.includes('INTERACTION_COLLECTOR_ERROR')) {
        await this.botMessagePrompt.edit(config.messages.prompts.promptTimeout);
        return;
      }

      this.botMessagePrompt.edit(messages.global.oops).catch(noop);
      throw err;
    } finally {
      collector.stop();
    }

    await this.mainBotMessage.edit({
      embeds: [this._embed.setColor(settings.colors.green).spliceFields(1, 1)],
      components: [],
    });
    await this.botMessagePrompt.delete();
    return this.responses;
  }

  private async _askPrompts(): Promise<void> {
    // 1. Ask for the targeted schoolyear
    const schoolYearInteraction = await this._makeSelectMenuStep(schoolYearMenu);
    this.responses.schoolYear = schoolYearInteraction.values.shift() as SchoolYear;
    await this._updateStep(schoolYearInteraction);

    // 2. Ask for the teaching unit
    const teachingUnitInteraction = await this._makeSelectMenuStep(teachingUnitMenu);
    this.responses.teachingUnit = teachingUnitInteraction.values.shift() as TeachingUnit;
    await this._updateStep(teachingUnitInteraction);

    // 3. Ask for the name
    this.responses.name = await this._makeMessageStep('autoPromptText', config.messages.prompts.name);
    await this._updateStep();

    // 4. Ask for the english name
    this.responses.nameEnglish = await this._makeMessageStep('autoPromptText', config.messages.prompts.englishName);
    await this._updateStep();

    // 5. Ask for the subject code
    this.responses.classCode = await this._makeMessageStep('autoPromptText', config.messages.prompts.classCode);
    await this._updateStep();

    // 6. Ask for the moodle link
    this.responses.moodleLink = await this._makeMessageStep('autoPromptText', config.messages.prompts.moodleLink);
    await this._updateStep();

    // 7. Ask for the text channel
    this.responses.textChannel = await this._makeMessageStep('autoPromptTextChannel', config.messages.prompts.textChannel);
    await this._updateStep();

    // 8. Ask for the emoji
    this.responses.emoji = await this._makeMessageStep('autoPromptText', config.messages.prompts.emoji);
  }

  private async _makeSelectMenuStep(component: MessageSelectMenu): Promise<SelectMenuInteraction> {
    this._actionRows.push(new MessageActionRow().addComponents([component]));
    await this.mainBotMessage.edit({ components: this._actionRows });

    const interaction = await this.mainBotMessage.awaitMessageComponent({
      componentType: component.type,
      time: 2 * 0 * 1000,
      filter: i => i.user.id === this.message.author.id && i.customId === component.customId && !this.aborted,
    });
    this._actionRows.splice(1);
    return interaction;
  }

  private async _makeMessageStep<
    Key extends keyof ArgumentPrompter,
    TResult extends A.Await<ReturnType<ArgumentPrompter[Key]>>,
  >(
    prompter: Key,
    prompts: PrompterText,
    validator: (resolved: TResult) => boolean = (): boolean => true,
  ): Promise<TResult> {
    let result;
    let previousIsFailure = false;
    do {
      result = await this.prompter[prompter](prompts, previousIsFailure) as TResult;
      if (this.aborted)
        return;

      previousIsFailure = true;
      for (const response of this._userResponses) {
        if (!response.author.bot) {
          await response.delete();
          this._userResponses.delete(response);
        }
      }
    } while (!validator(result));

    return result;
  }

  private async _updateStep(interaction?: SelectMenuInteraction): Promise<void> {
    this.step++;
    // eslint-disable-next-line unicorn/prefer-ternary
    if (interaction)
      await interaction.update({ embeds: [this._embed], components: this._actionRows });
    else
      await this.mainBotMessage.edit({ embeds: [this._embed], components: this._actionRows });
  }

  private _buildStepsPreview(): string {
    return pupa(config.messages.createSubjectSetup.stepPreview, {
      schoolYear: this.responses.schoolYear ?? this._emoteForStep(0),
      teachingUnit: this.responses.teachingUnit ?? this._emoteForStep(1),
      name: this.responses.name ?? this._emoteForStep(2),
      nameEnglish: this.responses.nameEnglish ?? this._emoteForStep(3),
      classCode: this.responses.classCode ?? this._emoteForStep(4),
      moodleLink: this.responses.moodleLink ?? this._emoteForStep(5),
      textChannel: this.responses.textChannel ?? this._emoteForStep(6),
      emoji: this.responses.emoji ?? this._emoteForStep(7),
    });
  }

  private _emoteForStep(index: number): string {
    return this.step === index ? ':gear:' : ':question:';
  }
}
