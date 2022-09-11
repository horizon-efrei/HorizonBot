/* eslint-disable max-lines */
import { ApplyOptions } from '@sapphire/decorators';
import type { Result } from '@sapphire/framework';
import { Resolvers } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { oneLine } from 'common-tags';
import dayjs from 'dayjs';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Modal,
  TextInputComponent,
} from 'discord.js';
import { MessageButtonStyles, MessageComponentTypes, TextInputStyles } from 'discord.js/typings/enums';
import pupa from 'pupa';

import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import { IsEprofOrStaff, ValidateEclassArgument } from '@/decorators';
import * as EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import Subject from '@/models/subject';
import * as CustomResolvers from '@/resolvers';
import PaginatedMessageEmbedFields from '@/structures/PaginatedMessageEmbedFields';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import type { GuildTextBasedChannel, SchoolYear } from '@/types';
import { EclassPlace, EclassPopulatedDocument, EclassStatus } from '@/types/database';
import { capitalize, nullop } from '@/utils';

const yesButton = new MessageButton()
  .setCustomId('yes-button')
  .setStyle(MessageButtonStyles.SUCCESS)
  .setLabel('Oui');

const noButton = new MessageButton()
  .setCustomId('no-button')
  .setStyle(MessageButtonStyles.DANGER)
  .setLabel('Non');

const yesNoButtonsRow = new MessageActionRow().setComponents(noButton, yesButton);

const placeInformationModal = (place: Exclude<EclassPlace, EclassPlace.Discord>): Modal => new Modal()
  .setTitle(config.messages.placeInformationModal.title)
  .setCustomId('place-information-modal')
  .addComponents(
    new MessageActionRow<TextInputComponent>().addComponents(
      new TextInputComponent()
        .setLabel(config.messages.placeInformationModal.label[place])
        .setPlaceholder(config.messages.placeInformationModal.placeholder[place])
        .setStyle(TextInputStyles.PARAGRAPH)
        .setCustomId('place-information')
        .setRequired(true),
    ),
  );

const statusOptions = {
  [EclassStatus.Planned]: 'Prévu',
  [EclassStatus.InProgress]: 'En cours',
  [EclassStatus.Finished]: 'Terminé',
  [EclassStatus.Canceled]: 'Annulé',
} as const;

const statusChoices = Object.entries(statusOptions).map(([value, name]) => ({ name, value: Number(value) }));

enum OptionRecordChoiceChoices {
  Add = 'add',
  Remove = 'remove',
  Show = 'show',
}

enum Options {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  SchoolYear = 'school-year',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Subject = 'subject',
  Topic = 'topic',
  Professor = 'professor',
  Duration = 'duration',
  Date = 'date',
  TargetRole = 'target-role',
  Place = 'place',
  PlaceInformation = 'place-information',
  IsRecorded = 'is-recorded',
  Status = 'status',
  Id = 'id',
  ShouldPing = 'should-ping',
  Choice = 'choice',
  Silent = 'silent',
  Link = 'link',
}

type Interaction = HorizonSubcommand.ChatInputInteraction<'cached'>;

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'list', chatInputRun: 'list' },
    { name: 'start', chatInputRun: 'start' },
    { name: 'finish', chatInputRun: 'finish' },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'cancel', chatInputRun: 'cancel' },
    { name: 'record', chatInputRun: 'record' },
    { name: 'info', chatInputRun: 'info' },
  ],
})
export default class EclassCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .addSubcommand(
          subcommand => subcommand
            .setName('create')
            .setDescription(this.descriptions.subcommands.create)
            .addStringOption(
              option => option
                .setName(Options.SchoolYear)
                .setDescription(this.descriptions.options.schoolYear)
                .setRequired(true)
                .setChoices(...this.messages.schoolYearChoices()),
            )
            .addStringOption(
              option => option
                .setName(Options.Subject)
                .setDescription(this.descriptions.options.subject)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Topic)
                .setDescription(this.descriptions.options.topic)
                .setRequired(true),
            )
            .addUserOption(
              option => option
                .setName(Options.Professor)
                .setDescription(this.descriptions.options.professor)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Duration)
                .setDescription(this.descriptions.options.duration)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Date)
                .setDescription(this.descriptions.options.date)
                .setRequired(true),
            )
            .addRoleOption(
              option => option
                .setName(Options.TargetRole)
                .setDescription(this.descriptions.options.targetRole)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Place)
                .setDescription(this.descriptions.options.place)
                .setRequired(true)
                .setChoices(...this.messages.placeChoices),
            )
            .addBooleanOption(
              option => option
                .setName(Options.IsRecorded)
                .setDescription(this.descriptions.options.isRecorded)
                .setRequired(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('list')
            .setDescription(this.descriptions.subcommands.list)
            .addStringOption(
              option => option
                .setName(Options.SchoolYear)
                .setDescription(this.descriptions.options.schoolYear)
                .setChoices(...this.messages.schoolYearChoices()),
            )
            .addIntegerOption(
              option => option
                .setName(Options.Status)
                .setDescription(this.descriptions.options.status)
                .setChoices(...statusChoices),
            )
            .addUserOption(
              option => option
                .setName(Options.Professor)
                .setDescription(this.descriptions.options.professor),
            )
            .addStringOption(
              option => option
                .setName(Options.Subject)
                .setDescription(this.descriptions.options.subject)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('start')
            .setDescription(this.descriptions.subcommands.start)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('finish')
            .setDescription(this.descriptions.subcommands.finish)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Topic)
                .setDescription(this.descriptions.options.topic),
            )
            .addUserOption(
              option => option
                .setName(Options.Professor)
                .setDescription(this.descriptions.options.professor),
            )
            .addStringOption(
              option => option
                .setName(Options.Duration)
                .setDescription(this.descriptions.options.duration),
            )
            .addStringOption(
              option => option
                .setName(Options.Date)
                .setDescription(this.descriptions.options.date),
            )
            .addStringOption(
              option => option
                .setName(Options.Place)
                .setDescription(this.descriptions.options.place)
                .setChoices(...this.messages.placeChoices),
            )
            .addBooleanOption(
              option => option
                .setName(Options.IsRecorded)
                .setDescription(this.descriptions.options.isRecorded),
            )
            .addBooleanOption(
              option => option
                .setName(Options.ShouldPing)
                .setDescription(this.descriptions.options.shouldPing),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('cancel')
            .setDescription(this.descriptions.subcommands.cancel)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('record')
            .setDescription(this.descriptions.subcommands.record)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Choice)
                .setDescription(this.descriptions.options.choice)
                .setRequired(true)
                .setChoices(
                  { name: 'Ajouter le lien', value: OptionRecordChoiceChoices.Add },
                  { name: 'Enlever le lien', value: OptionRecordChoiceChoices.Remove },
                  { name: 'Voir le lien', value: OptionRecordChoiceChoices.Show },
                ),
            )
            .addBooleanOption(
              option => option
                .setName(Options.Silent)
                .setDescription(this.descriptions.options.silent),
            )
            .addStringOption(
              option => option
                .setName(Options.Link)
                .setDescription(this.descriptions.options.link),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('info')
            .setDescription(this.descriptions.subcommands.info)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        ),
      { guildIds: settings.mainGuildIds },
      );
  }

  @IsEprofOrStaff()
  public async create(interaction: Interaction): Promise<void> {
    const rawSubject = interaction.options.getString(Options.Subject, true);
    const topic = interaction.options.getString(Options.Topic, true);
    const professor = interaction.options.getMember(Options.Professor, true);
    const rawDuration = interaction.options.getString(Options.Duration, true);
    const rawDate = interaction.options.getString(Options.Date, true);
    const targetRole = interaction.options.getRole(Options.TargetRole, true);
    const place = interaction.options.getString(Options.Place, true) as EclassPlace;
    const isRecorded = interaction.options.getBoolean(Options.IsRecorded, true);

    const subject = await Subject.findOne({ classCode: rawSubject });
    if (!subject) {
      await interaction.reply({ content: this.messages.invalidSubject, ephemeral: true });
      return;
    }

    const duration = CustomResolvers.resolveDuration(rawDuration);
    if (duration.isErr()) {
      await interaction.reply({ content: this.messages.invalidDuration, ephemeral: true });
      return;
    }

    const date = CustomResolvers.resolveDate(rawDate);
    if (date.isErr()) {
      await interaction.reply({ content: this.messages.invalidDate, ephemeral: true });
      return;
    }

    if (!EclassManager.validateDateSpan(date.unwrap())) {
      await interaction.reply({ content: this.messages.invalidDate, ephemeral: true });
      return;
    }

    const overlaps = await EclassManager.checkOverlaps({
      date: date.unwrap(),
      duration: duration.unwrap(),
      professorId: professor.id,
      subject,
    });
    if (overlaps.isSome()) {
      await interaction.reply({ content: overlaps.unwrap(), ephemeral: true });
      return;
    }

    let answerTo: CommandInteraction<'cached'> | ModalSubmitInteraction<'cached'> = interaction;
    let placeInformation: string | null = null;
    if (place !== EclassPlace.Discord) {
      await answerTo.showModal(placeInformationModal(place));
      const submit = await answerTo.awaitModalSubmit({
        filter: int => int.isModalSubmit()
          && int.inCachedGuild()
          && int.customId === 'place-information-modal'
          && int.member.id === answerTo.member.id,
        time: 900_000, // 15 minutes
      });

      answerTo = submit;
      placeInformation = submit.fields.getTextInputValue('place-information');

      if (place === EclassPlace.Teams) {
        const url = Resolvers.resolveHyperlink(placeInformation);
        if (url.isErr()) {
          await answerTo.reply({ content: this.messages.invalidTeamsUrl, ephemeral: true });
          return;
        }
        placeInformation = url.unwrap().toString();
      }
    }

    const result = await EclassManager.createClass(answerTo, {
      subject,
      topic,
      professor,
      duration: duration.unwrap(),
      date: date.unwrap(),
      targetRole,
      place,
      placeInformation,
      isRecorded,
    });

    if (result.isErr()) {
      await answerTo.reply({ content: result.unwrapErr(), ephemeral: true });
      return;
    }

    await interaction.reply(pupa(config.messages.successfullyCreated, { eclass: result.unwrap() }));
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async start(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    // Start the class & confirm.
    await EclassManager.startClass(eclass);
    await interaction.reply(this.messages.successfullyStarted);
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async edit(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    const shouldPing = interaction.options.getBoolean(Options.ShouldPing) ?? false;

    const topic = interaction.options.getString(Options.Topic);
    const professor = interaction.options.getMember(Options.Professor);
    const rawDuration = interaction.options.getString(Options.Duration);
    const rawDate = interaction.options.getString(Options.Date);
    const place = interaction.options.getString(Options.Place) as EclassPlace | null;
    const isRecorded = interaction.options.getBoolean(Options.IsRecorded);

    let duration: number | null = null;
    let date: Date | null = null;

    if (rawDuration) {
      const durationResult = CustomResolvers.resolveDuration(rawDuration);
      if (durationResult.isErr()) {
        await interaction.reply({ content: this.messages.invalidDuration, ephemeral: true });
        return;
      }
      duration = durationResult.unwrap();
    }

    if (rawDate) {
      const dateResult = CustomResolvers.resolveDate(rawDate);
      if (dateResult.isErr()) {
        await interaction.reply({ content: this.messages.invalidDate, ephemeral: true });
        return;
      }
      date = dateResult.unwrap();
    }

    const updateMessages: string[] = [];
    const notificationMessages: string[] = [];
    let answerTo: CommandInteraction<'cached'> | ModalSubmitInteraction<'cached'> = interaction;

    if (topic) {
      eclass.topic = topic;
      updateMessages.push(this.messages.editedTopic);
      notificationMessages.push(this.messages.pingEditedTopic);
    }

    if (professor) {
      eclass.professorId = professor.id;
      updateMessages.push(this.messages.editedProfessor);
      notificationMessages.push(this.messages.pingEditedProfessor);
    }

    if (duration) {
      eclass.duration = duration;
      updateMessages.push(this.messages.editedDuration);
      notificationMessages.push(this.messages.pingEditedDuration);
    }

    if (date) {
      eclass.date = date;
      updateMessages.push(this.messages.editedDate);
      notificationMessages.push(this.messages.pingEditedDate);
    }

    if (duration || date) {
      const chosenDate = new Date(eclass.date);
      if (!EclassManager.validateDateSpan(chosenDate)) {
        await answerTo.reply({ content: this.messages.invalidDate, ephemeral: true });
        return;
      }

      const overlaps = await EclassManager.checkOverlaps(eclass);
      if (overlaps.isSome()) {
        await interaction.reply({ content: overlaps.unwrap(), ephemeral: true });
        return;
      }

      if (eclass.reminded && dayjs(date).isAfter(dayjs().add(15, 'minutes')))
        eclass.reminded = false;
    }

    if (place) {
      eclass.place = place;
      updateMessages.push(this.messages.editedPlace);
      notificationMessages.push(this.messages.pingEditedPlace);

      if (place === EclassPlace.Discord) {
        eclass.placeInformation = null;
      } else {
        await answerTo.showModal(placeInformationModal(place));
        const submit = await answerTo.awaitModalSubmit({
          filter: int => int.isModalSubmit()
            && int.inCachedGuild()
            && int.customId === 'place-information-modal'
            && int.member.id === answerTo.member.id,
          time: 900_000, // 15 minutes
        });

        answerTo = submit;
        const placeInformation = submit.fields.getTextInputValue('place-information');

        if (place === EclassPlace.Teams) {
          const url = Resolvers.resolveHyperlink(placeInformation);
          if (url.isErr()) {
            await answerTo.reply({ content: this.messages.invalidTeamsUrl, ephemeral: true });
            return;
          }
          eclass.placeInformation = url.unwrap().toString();
        } else {
          eclass.placeInformation = placeInformation;
        }
      }
    }

    if (!isNullish(isRecorded)) {
      eclass.isRecorded = isRecorded;
      updateMessages.push(this.messages.editedIsRecorded);
      notificationMessages.push(this.messages.pingEditedIsRecorded[Number(isRecorded)]);
    }

    await answerTo.deferReply();

    await eclass.save();
    const { guild } = answerTo;

    const formattedDate = dayjs(eclass.date).format(settings.configuration.dateFormat);
    const classChannel = answerTo.guild.channels.resolve(eclass.subject.textChannelId) as GuildTextBasedChannel;

    // Fetch the announcement message
    const originalChannel = await this.container.client.configManager.get(eclass.announcementChannelId, guild.id);
    if (originalChannel) {
      const originalMessage = await originalChannel.messages.fetch(eclass.announcementMessageId);

      // Edit the announcement embed
      await originalMessage.edit({
        content: originalMessage.content,
        embeds: [EclassManager.createAnnouncementEmbed({
          ...eclass.normalizeDates(),
          subject: eclass.subject,
          topic: eclass.topic,
          duration: eclass.duration,
          professor: await guild.members.fetch(eclass.professorId),
          classChannel,
          classId: eclass.classId,
          isRecorded: eclass.isRecorded,
          place: eclass.place,
          placeInformation: eclass.placeInformation,
        })],
      });
    }

    // Edit the global announcement messages (calendar & week upcoming classes)
    await EclassManager.updateGlobalAnnouncements(guild.id, eclass.subject.schoolYear);

    // Edit the role
    const originalRole = guild.roles.resolve(eclass.classRoleId);
    if (originalRole) {
      const newRoleName = EclassManager.getRoleNameForClass({
        formattedDate,
        subject: eclass.subject,
        topic: eclass.topic,
      });
      if (originalRole.name !== newRoleName)
        await originalRole.setName(newRoleName);
    }

    // Send messages
    const payload = {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(true),
      pingRole: guild.roles.resolve(eclass.classRoleId),
      where: this.messages.where(eclass),
    };
    await answerTo.followUp(pupa(`${this.messages.headerEdited}${updateMessages.join('\n')}`, payload));
    if (shouldPing)
      await classChannel.send(pupa(`${this.messages.headerPingEdited}${notificationMessages.join('\n')}`, payload));
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned, EclassStatus.InProgress] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async cancel(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    await interaction.reply({
      content: this.messages.confirmCancel,
      components: [yesNoButtonsRow],
    });

    const buttonInteraction = await interaction.channel!.awaitMessageComponent({
      componentType: MessageComponentTypes.BUTTON,
      time: 30_000,
      filter: int => int.user.id === interaction.user.id && (int.customId === 'yes-button' || int.customId === 'no-button'),
    }).catch(nullop);
    if (!buttonInteraction) {
      await interaction.editReply(this.messages.canceledCancel);
      return;
    }

    if (buttonInteraction.customId !== 'yes-button') {
      await buttonInteraction.update(this.messages.canceledCancel);
      return;
    }

    // Cancel the class & confirm.
    await EclassManager.cancelClass(eclass);
    await buttonInteraction.update(this.messages.successfullyCanceled);
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.InProgress] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async finish(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    // Finish the class & confirm.
    await EclassManager.finishClass(eclass);
    await interaction.reply(this.messages.successfullyFinished);
  }

  @ValidateEclassArgument()
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async record(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    const action = interaction.options.getString(Options.Choice, true) as OptionRecordChoiceChoices;

    let link: Result<URL, string> | null = null;
    if ([OptionRecordChoiceChoices.Add, OptionRecordChoiceChoices.Remove].includes(action)) {
      // Check the status before setting a URL
      if (eclass.status !== EclassStatus.Finished) {
        await interaction.reply({
          content: pupa(this.messages.statusIncompatible, { status: eclass.getStatus() }),
          ephemeral: true,
        });
        return;
      }

      const rawLink = interaction.options.getString(Options.Link);
      if (!rawLink) {
        await interaction.reply({ content: this.messages.noRecordLinkProvided, ephemeral: true });
        return;
      }

      link = Resolvers.resolveHyperlink(rawLink);
      if (link.isErr()) {
        await interaction.reply({ content: this.messages.invalidRecordLink, ephemeral: true });
        return;
      }
    }

    switch (action) {
      case OptionRecordChoiceChoices.Add: {
        const silent = interaction.options.getBoolean(Options.Silent) ?? false;

        // Change the URL & confirm
        await EclassManager.addRecordLink(eclass, link!.unwrap().toString(), silent);
        await interaction.reply(this.messages.successfullyAddedLink);
        break;
      }
      case OptionRecordChoiceChoices.Remove: {
        // Change the URL & confirm
        await EclassManager.removeRecordLink(eclass, link!.unwrap().toString());
        await interaction.reply(this.messages.successfullyRemovedLink);
        break;
      }
      case OptionRecordChoiceChoices.Show:
        // Show the current URL if any
        await interaction.reply(eclass.recordLinks.length > 0
          ? pupa(this.messages.recordLinksHeader, {
              links: eclass.recordLinks.map(l => pupa(this.messages.recordLinkLine, { link: l })).join('\n'),
            })
          : this.messages.noRecordLinks);
        break;
    }
  }

  @ValidateEclassArgument()
  public async info(interaction: Interaction, eclass: EclassPopulatedDocument): Promise<void> {
    const payload = {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(true),
      subject: eclass.subject.toJSON(),
      status: capitalize(this.messages.rawStatuses[eclass.status]),
      where: this.messages.where(eclass),
      recorded: oneLine`
        ${this.messages.recordedValues[Number(eclass.isRecorded)]}
        ${eclass.recordLinks.map(link => pupa(this.messages.recordedLink, { link })).join('\n')}
      `,
      messageLink: eclass.getMessageLink(),
    };

    const texts = this.messages.showEmbed;
    const embed = new MessageEmbed()
      .setColor(settings.colors.primary)
      .setTitle(pupa(texts.title, eclass.toJSON()))
      .addFields(
        { name: texts.subjectName, value: pupa(texts.subjectValue, payload), inline: true },
        { name: texts.statusName, value: pupa(texts.statusValue, payload), inline: true },
        { name: texts.dateName, value: pupa(texts.dateValue, payload), inline: true },
        { name: texts.professorName, value: pupa(texts.professorValue, payload), inline: true },
        { name: texts.placeName, value: pupa(texts.placeValue, payload), inline: true },
        { name: texts.recordedName, value: pupa(texts.recordedValue, payload), inline: true },
        { name: texts.relatedName, value: pupa(texts.relatedValue, payload), inline: true },
      );

    // Change the URL & confirm
    await interaction.reply({ embeds: [embed] });
  }

  public async list(interaction: Interaction): Promise<void> {
    // TODO: Add filter by date (before/after)
    // TODO: Add ability to combine same filters with each-other
    const eclasses: EclassPopulatedDocument[] = await Eclass.find({ guild: interaction.guild.id });

    const filters: Array<(eclass: EclassPopulatedDocument) => boolean> = [];
    const filterDescriptions: string[] = [];

    const schoolYear = interaction.options.getString(Options.SchoolYear) as SchoolYear | null;
    if (schoolYear) {
      filters.push(eclass => eclass.subject.schoolYear === schoolYear);
      filterDescriptions.push(pupa(this.messages.statusFilter, {
        value: this.messages.schoolYearChoices().find(({ value }) => value === schoolYear),
      }));
    }

    const status = interaction.options.getInteger(Options.Status) as EclassStatus | null;
    if (!isNullish(status)) {
      filters.push(eclass => eclass.status === status);
      filterDescriptions.push(pupa(this.messages.statusFilter, { value: this.messages.rawStatuses[status] }));
    }

    const professor = interaction.options.getMember(Options.Professor);
    if (professor) {
      filters.push(eclass => eclass.professorId === professor.id);
      filterDescriptions.push(pupa(this.messages.professorFilter, { value: professor }));
    }

    const subject = interaction.options.getString(Options.Subject);
    if (subject) {
      filters.push(eclass => eclass.subject.classCode === subject);
      filterDescriptions.push(pupa(this.messages.subjectFilter, { value: subject }));
    }

    const filterDescription = filterDescriptions.length > 0
      ? pupa(this.messages.filterTitle, { filters: filterDescriptions.join('\n') })
      : this.messages.noFilter;

    // Change the ".every" to ".some" to have a "OR" between the filters, rather than "AND".
    const filteredClasses = eclasses.filter(eclass => filters.every(filter => filter(eclass)));

    const baseEmbed = new MessageEmbed()
      .setTitle(this.messages.listTitle)
      .setColor(settings.colors.default);

    if (filteredClasses.length === 0) {
      await interaction.reply({ embeds: [baseEmbed.setDescription(`${filterDescription}${this.messages.noClassesFound}`)] });
      return;
    }

    await new PaginatedMessageEmbedFields()
      .setTemplate(
        baseEmbed.setDescription(`${filterDescription}${this.messages.someClassesFound(filteredClasses.length)}`),
      )
      .setItems(
        filteredClasses.map((eclass) => {
          const eclassInfos = {
            ...eclass.toJSON(),
            ...eclass.normalizeDates(true),
            status: capitalize(this.messages.rawStatuses[eclass.status]),
            where: this.messages.where(eclass),
          };
          return {
            name: pupa(this.messages.listFieldTitle, eclassInfos),
            value: pupa(this.messages.listFieldDescription, eclassInfos),
          };
        }),
      )
      .setItemsPerPage(3)
      .make()
      .run(interaction);
  }
}
