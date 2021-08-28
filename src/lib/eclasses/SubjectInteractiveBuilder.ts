import {
  Constants,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import type {
  BaseGuildVoiceChannel,
  ButtonInteraction,
  Message,
  SelectMenuInteraction,
} from 'discord.js';
import pupa from 'pupa';
import type { A } from 'ts-toolbelt';
import { subject as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage, GuildTextBasedChannel, PrompterText } from '@/types';
import { SchoolYear, TeachingUnit } from '@/types';

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
  public stopped = false;
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

    // TODO: Handle abort better
    const collector = this.mainBotMessage.createMessageComponentCollector<ButtonInteraction>({ componentType: 'BUTTON' })
      .on('collect', async (interaction) => {
        if (interaction.customId === 'abort') {
          await interaction.update({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
          await this.botMessagePrompt.edit(config.messages.prompts.stoppedPrompting);
          this.stopped = true;
        }
      });

    await this._askPrompts();
    collector.stop();

    if (this.stopped)
      return;

    await this.mainBotMessage.edit({
      embeds: [this._embed.setColor(settings.colors.green).spliceFields(1, 1)],
      components: [],
    });
    await this.botMessagePrompt.edit(JSON.stringify(this.responses, null, 2));
    return this.responses;
  }

  private async _askPrompts(): Promise<void> {
    // 1. Ask for the targeted schoolyear
    const schoolYearInteraction = await this._makeSelectMenuStep(schoolYearMenu);
    if (this.stopped)
      return;
    this.responses.schoolYear = schoolYearInteraction.values.shift() as SchoolYear;
    this.step++;
    await this._updateStep(schoolYearInteraction);
    if (this.stopped)
      return;


    // 2. Ask for the teaching unit
    const teachingUnitInteraction = await this._makeSelectMenuStep(teachingUnitMenu);
    if (this.stopped)
      return;
    this.responses.teachingUnit = teachingUnitInteraction.values.shift() as TeachingUnit;
    this.step++;
    await this._updateStep(teachingUnitInteraction);
    if (this.stopped)
      return;


    // 3. Ask for the name
    this.responses.name = await this._makeMessageStep('autoPromptText', config.messages.prompts.name);
    this.step++;
    await this._updateStep();
    if (this.stopped)
      return;


    // 4. Ask for the english name
    this.responses.nameEnglish = await this._makeMessageStep('autoPromptText', config.messages.prompts.englishName);
    this.step++;
    await this._updateStep();
    if (this.stopped)
      return;


    // 5. Ask for the subject code
    this.responses.classCode = await this._makeMessageStep('autoPromptText', config.messages.prompts.classCode);
    this.step++;
    await this._updateStep();
    if (this.stopped)
      return;


    // 6. Ask for the moodle link
    this.responses.moodleLink = await this._makeMessageStep('autoPromptText', config.messages.prompts.moodleLink);
    this.step++;
    await this._updateStep();
    if (this.stopped)
      return;


    // 7. Ask for the text channel
    this.responses.textChannel = await this._makeMessageStep('autoPromptTextChannel', config.messages.prompts.textChannel);
    this.step++;
    await this._updateStep();
    if (this.stopped)
      return;


    // 8. Ask for the emoji
    this.responses.emoji = await this._makeMessageStep('autoPromptText', config.messages.prompts.emoji);
  }

  private async _makeSelectMenuStep(component: MessageSelectMenu): Promise<SelectMenuInteraction> {
    this._actionRows.push(new MessageActionRow().addComponents([component]));
    await this.mainBotMessage.edit({ components: this._actionRows });

    const interaction = await this.mainBotMessage.awaitMessageComponent<SelectMenuInteraction>({
      componentType: component.type,
      time: 2 * 60 * 1000,
      filter: i => i.user.id === this.message.author.id && i.customId === component.customId && !this.stopped,
    }).catch(async () => {
      this.stopped = true;
      await this.mainBotMessage.edit({ embeds: [this._embed.setColor(settings.colors.orange)], components: [] });
      await this.botMessagePrompt.edit(config.messages.prompts.promptTimeout);
      return null;
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
    // Await this.mainBotMessage.edit({ components: this.actionRows });

    let result;
    let previousIsFailure = false;
    do {
      result = await this.prompter[prompter](prompts, previousIsFailure) as TResult;
      if (this.stopped)
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
