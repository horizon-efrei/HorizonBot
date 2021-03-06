import { ApplyOptions } from '@sapphire/decorators';
import { MessagePrompter } from '@sapphire/discord.js-utilities';
import { Args, Resolvers } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { oneLine } from 'common-tags';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';

import ArgumentPrompter from '@/app/lib/structures/ArgumentPrompter';
import { eclass as config } from '@/config/commands/professors';
import messages from '@/config/messages';
import settings from '@/config/settings';
import { IsEprofOrStaff, ValidateEclassArgument } from '@/decorators';
import EclassInteractiveBuilder from '@/eclasses/EclassInteractiveBuilder';
import * as EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import PaginatedMessageEmbedFields from '@/structures/PaginatedMessageEmbedFields';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import type { GuildTextBasedChannel } from '@/types';
import { GuildMessage } from '@/types';
import { EclassPlace, EclassPopulatedDocument, EclassStatus } from '@/types/database';
import { capitalize, generateSubcommands, nullop } from '@/utils';

const listOptions = {
  status: ['status', 'statut', 's'],
  professor: ['professor', 'professeur', 'prof', 'p'],
  subject: ['subject', 'matière', 'matiere', 'm'],
  role: ['role', 'rôle', 'r'],
};
const statusOptionValues: Array<[possibilities: string[], status: EclassStatus]> = [
  [['planned', 'plan', 'p', 'prévu', 'prevu'], EclassStatus.Planned],
  [['inprogress', 'progress', 'r', 'encours', 'e'], EclassStatus.InProgress],
  [['finished', 'f', 'terminé', 'terminer', 'termine', 't'], EclassStatus.Finished],
  [['canceled', 'c', 'annulé', 'annuler', 'annule', 'a'], EclassStatus.Canceled],
];

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  flags: ['ping', 'silent'],
  preconditions: ['GuildOnly'],
  options: Object.values(listOptions).flat(),
  subCommands: generateSubcommands(['create', 'list', 'help'], {
    start: { aliases: ['begin'] },
    edit: { aliases: ['change', 'modify'] },
    cancel: { aliases: ['archive'] },
    finish: { aliases: ['end', 'stop'] },
    record: { aliases: ['enregistrement', 'link', 'lien', 'replay', 'recording'] },
    info: { aliases: ['infos', 'information', 'informations'] },
  }),
})
export default class EclassCommand extends HorizonSubCommand {
  @IsEprofOrStaff()
  public async create(message: GuildMessage): Promise<void> {
    const responses = await new EclassInteractiveBuilder(message).start();
    if (!responses)
      return;
    await EclassManager.createClass(message, responses);
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async start(message: GuildMessage, _args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    // Fetch the member
    const professor = await message.guild.members.fetch(eclass.professor).catch(nullop);
    if (!professor) {
      await message.channel.send(config.messages.unresolvedProfessor);
      return;
    }

    // Start the class & confirm.
    await EclassManager.startClass(eclass);
    await message.channel.send(config.messages.successfullyStarted);
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  // eslint-disable-next-line complexity
  public async edit(message: GuildMessage, args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    // Resolve the given arguments & validate them
    const shouldPing = args.getFlags('ping');
    const property = await args.pickResult('string');
    if (property.error) {
      await message.channel.send(config.messages.invalidEditProperty);
      return;
    }

    let updateMessage: string;
    let notificationMessage: string;

    switch (property.value) {
      case 'topic':
      case 'thème':
      case 'theme':
      case 'sujet': {
        const topic = await args.restResult('string');
        if (topic.error) {
          await message.channel.send(config.messages.prompts.topic.invalid);
          return;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { topic: topic.value },
          { new: true },
        );
        updateMessage = config.messages.editedTopic;
        notificationMessage = config.messages.pingEditedTopic;
        break;
      }

      case 'date': {
        const newDate = await args.restResult('day');
        if (newDate.error) {
          await message.channel.send(`${config.messages.prompts.date.invalid} ${config.messages.prompts.date.hint}`);
          return;
        }

        const date = new Date(eclass.date);
        date.setMonth(newDate.value.getMonth());
        date.setDate(newDate.value.getDate());

        if (!EclassManager.validateDateSpan(date)) {
          await message.channel.send(config.messages.prompts.date.invalid);
          return;
        }

        const overlaps = await EclassManager.checkOverlaps(date, eclass.duration, {
          schoolYear: eclass.subject.schoolYear,
          professorId: eclass.professor,
        });
        if (overlaps.any) {
          await message.channel.send(overlaps.error);
          return;
        }

        let { reminded } = eclass;
        if (reminded && dayjs(date).isAfter(dayjs().add(15, 'minutes')))
          reminded = false;

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { date: date.getTime(), end: date.getTime() + eclass.duration, reminded },
          { new: true },
        );
        updateMessage = config.messages.editedDate;
        notificationMessage = config.messages.pingEditedDate;
        break;
      }

      case 'hour':
      case 'heure': {
        const newHour = await args.restResult('hour');
        if (newHour.error) {
          await message.channel.send(`${config.messages.prompts.hour.invalid} ${config.messages.prompts.hour.hint}`);
          return;
        }

        const date = new Date(eclass.date);
        date.setHours(newHour.value.hour);
        date.setMinutes(newHour.value.minutes);

        if (!EclassManager.validateDateSpan(date)) {
          await message.channel.send(config.messages.prompts.hour.invalid);
          return;
        }

        const overlaps = await EclassManager.checkOverlaps(date, eclass.duration, {
          schoolYear: eclass.subject.schoolYear,
          professorId: eclass.professor,
        });
        if (overlaps.any) {
          await message.channel.send(overlaps.error);
          return;
        }

        let { reminded } = eclass;
        if (reminded && dayjs(date).isAfter(dayjs().add(15, 'minutes')))
          reminded = false;

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { date: date.getTime(), end: date.getTime() + eclass.duration, reminded },
          { new: true },
        );
        updateMessage = config.messages.editedHour;
        notificationMessage = config.messages.pingEditedHour;
        break;
      }

      case 'duration':
      case 'duree':
      case 'durée': {
        const duration = await args.restResult('duration');
        if (duration.error) {
          await message.channel.send(`${config.messages.prompts.duration.invalid} ${config.messages.prompts.duration.hint}`);
          return;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { duration: duration.value, end: eclass.date + duration.value },
          { new: true },
        );
        updateMessage = config.messages.editedDuration;
        notificationMessage = config.messages.pingEditedDuration;
        break;
      }

      case 'professor':
      case 'professeur':
      case 'prof': {
        const professor = await args.restResult('member');
        if (professor.error) {
          await message.channel.send(`${config.messages.prompts.professor.invalid} ${config.messages.prompts.professor.hint}`);
          return;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { professor: professor.value.id },
          { new: true },
        );
        updateMessage = config.messages.editedProfessor;
        notificationMessage = config.messages.pingEditedProfessor;
        break;
      }

      case 'lieu':
      case 'place': {
        const rawPlace = await args.restResult('string');
        if (rawPlace.error || !['discord', 'teams', 'campus', 'autre'].includes(rawPlace.value)) {
          await message.channel.send(`${config.messages.prompts.place.invalid} ${config.messages.prompts.place.hint}`);
          return;
        }

        const placeMap = {
          discord: EclassPlace.Discord,
          teams: EclassPlace.Teams,
          campus: EclassPlace.OnSite,
          autre: EclassPlace.Other,
        };

        const place = placeMap[rawPlace.value as keyof typeof placeMap];

        const prompter = new ArgumentPrompter(message);
        let placeInformation: string | null;
        switch (place) {
          case EclassPlace.Teams:
            placeInformation = (await prompter.autoPromptUrl(config.messages.prompts.teamsLink)).toString();
            break;
          case EclassPlace.OnSite:
            placeInformation = await prompter.autoPromptText(config.messages.prompts.room);
            break;
          case EclassPlace.Other:
            placeInformation = await prompter.autoPromptText(config.messages.prompts.customPlace);
            break;
          case EclassPlace.Discord:
            placeInformation = null;
            break;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { place, placeInformation },
          { new: true },
        );
        updateMessage = config.messages.editedPlace;
        notificationMessage = config.messages.pingEditedPlace;
        break;
      }

      case 'record':
      case 'recorded':
      case 'enregistre':
      case 'enregistré': {
        const isRecorded = await args.restResult('boolean');
        if (isRecorded.error) {
          await message.channel.send(`${config.messages.prompts.recorded.invalid} ${config.messages.prompts.recorded.hint}`);
          return;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { isRecorded: isRecorded.value },
          { new: true },
        );
        updateMessage = config.messages.editedRecorded;
        notificationMessage = `${config.messages.pingEditedRecorded}${config.messages.pingEditedRecordedValues[Number(isRecorded.value)]}`;
        break;
      }

      default:
        await message.channel.send(config.messages.invalidEditProperty);
        return;
    }

    // Fetch the announcement message
    const originalChannel = await this.container.client.configManager.get(eclass.announcementChannel, message.guild.id);
    const originalMessage = await originalChannel.messages.fetch(eclass.announcementMessage);

    // Edit the announcement embed
    const formattedDate = dayjs(eclass.date).format(settings.configuration.dateFormat);
    const classChannel = message.guild.channels.resolve(eclass.subject.textChannel) as GuildTextBasedChannel;
    await originalMessage.edit({
      content: originalMessage.content,
      embeds: [EclassManager.createAnnouncementEmbed({
        ...eclass.normalizeDates(),
        subject: eclass.subject,
        topic: eclass.topic,
        duration: eclass.duration,
        professor: await message.guild.members.fetch(eclass.professor),
        classChannel,
        classId: eclass.classId,
        isRecorded: eclass.isRecorded,
        place: eclass.place,
        placeInformation: eclass.placeInformation,
      })],
    });

    // Edit the global announcement messages (calendar & week upcoming classes)
    await EclassManager.updateGlobalAnnouncements(message.guild.id, eclass.subject.schoolYear);

    // Edit the role
    const { subject, topic } = eclass;
    const originalRole = message.guild.roles.resolve(eclass.classRole);
    const newRoleName = EclassManager.getRoleNameForClass({ formattedDate, subject, topic });
    if (originalRole.name !== newRoleName)
      await originalRole.setName(newRoleName);

    // Send messages
    const payload = {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(true),
      role: message.guild.roles.resolve(eclass.targetRole).name,
      pingRole: message.guild.roles.resolve(eclass.classRole),
      where: config.messages.where(eclass),
    };
    await message.channel.send(pupa(updateMessage, payload));
    if (shouldPing)
      await classChannel.send(pupa(notificationMessage, payload));
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.Planned, EclassStatus.InProgress] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async cancel(message: GuildMessage, _args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    const handler = new MessagePrompter(config.messages.confirmCancel, 'confirm', {
      confirmEmoji: settings.emojis.yes,
      cancelEmoji: settings.emojis.no,
      timeout: 2 * 60 * 1000,
    });
    const isConfirmed = await handler.run(message.channel, message.author).catch(nullop);
    if (!isConfirmed) {
      await message.channel.send(messages.prompts.stoppedPrompting);
      return;
    }

    // Cancel the class & confirm.
    await EclassManager.cancelClass(eclass);
    await message.channel.send(config.messages.successfullyCanceled);
  }

  @ValidateEclassArgument({ statusIn: [EclassStatus.InProgress] })
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async finish(message: GuildMessage, _args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    // Fetch the member
    const professor = await message.guild.members.fetch(eclass.professor).catch(nullop);
    if (!professor) {
      await message.channel.send(config.messages.unresolvedProfessor);
      return;
    }

    // Finish the class & confirm.
    await EclassManager.finishClass(eclass);
    await message.channel.send(config.messages.successfullyFinished);
  }

  @ValidateEclassArgument()
  @IsEprofOrStaff({ isOriginalEprof: true })
  public async record(message: GuildMessage, args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    const silent = args.getFlags('silent');

    // Parse the URL
    const link = await args.pickResult('url');
    if (link.error) {
      // Show the current URL if any
      await message.channel.send(eclass.recordLink
        ? pupa(config.messages.recordLink, { link: eclass.recordLink })
        : config.messages.noRecordLink);
      return;
    }

    // Check the status before setting a URL
    if (eclass.status !== EclassStatus.Finished) {
      await message.channel.send(pupa(config.messages.statusIncompatible, { status: eclass.getStatus() }));
      return;
    }

    // Change the URL & confirm
    await EclassManager.setRecordLink(eclass, link.value.toString(), silent);

    // Edit the global announcement messages (calendar & week upcoming classes)
    await EclassManager.updateGlobalAnnouncements(message.guild.id, eclass.subject.schoolYear);

    await message.channel.send(config.messages.successfullyAddedLink);
  }

  @ValidateEclassArgument()
  public async info(message: GuildMessage, _args: Args, eclass: EclassPopulatedDocument): Promise<void> {
    const messageLink = eclass.getMessageLink();
    const capitalizedStatus = capitalize(config.messages.rawStatuses[eclass.status]);
    const recordedText = oneLine`
      ${config.messages.recordedValues[Number(eclass.isRecorded)]}
      ${eclass.recordLink ? pupa(config.messages.recordedLink, eclass) : ''}
    `;

    const texts = config.messages.showEmbed;
    const embed = new MessageEmbed()
      .setColor(settings.colors.primary)
      .setTitle(pupa(texts.title, eclass.toJSON()))
      .addField(texts.subjectName, pupa(texts.subjectValue, eclass.toJSON()), true)
      .addField(texts.statusName, pupa(texts.statusValue, { ...eclass.toJSON(), status: capitalizedStatus }), true)
      .addField(texts.dateName, pupa(texts.dateValue, {
        ...eclass.toJSON(),
        ...eclass.normalizeDates(true),
      }), true)
      .addField(texts.professorName, pupa(texts.professorValue, eclass.toJSON()), true)
      .addField(texts.placeName, pupa(texts.placeValue, {
        ...eclass.toJSON(),
        where: config.messages.where(eclass),
      }), true)
      .addField(texts.recordedName, pupa(texts.recordedValue, { ...eclass.toJSON(), recorded: recordedText }), true)
      .addField(texts.relatedName, pupa(texts.relatedValue, { ...eclass.toJSON(), messageLink }), true);

    // Change the URL & confirm
    await message.channel.send({ embeds: [embed] });
  }

  public async list(message: GuildMessage, args: Args): Promise<void> {
    // TODO: Add filter by date (before/after)
    // TODO: Add ability to combine same filters with each-other
    const eclasses: EclassPopulatedDocument[] = await Eclass.find({ guild: message.guild.id });

    const filters: Array<(eclass: EclassPopulatedDocument) => boolean> = [];
    const filterDescriptions: string[] = [];

    const statusQuery = args.getOption(...listOptions.status);
    if (statusQuery) {
      const value = statusOptionValues.find(([keys]) => keys.includes(statusQuery))?.[1];
      if (typeof value !== 'undefined') {
        filters.push(eclass => eclass.status === value);
        filterDescriptions.push(pupa(config.messages.statusFilter, { value: config.messages.rawStatuses[value] }));
      }
    }

    const professorQuery = args.getOption(...listOptions.professor);
    if (professorQuery) {
      const resolvedMember = await Resolvers.resolveMember(professorQuery, message.guild);
      const value = resolvedMember?.value;
      if (value) {
        filters.push(eclass => eclass.professor === value.id);
        filterDescriptions.push(pupa(config.messages.professorFilter, { value }));
      }
    }

    const roleQuery = args.getOption(...listOptions.role);
    if (roleQuery) {
      const resolvedRole = await Resolvers.resolveRole(roleQuery, message.guild);
      const value = resolvedRole?.value;
      if (value) {
        filters.push(eclass => eclass.targetRole === value.id);
        filterDescriptions.push(pupa(config.messages.roleFilter, { value }));
      }
    }

    const subjectQuery = args.getOption(...listOptions.subject);
    if (subjectQuery) {
      filters.push(eclass => eclass.subject.classCode === subjectQuery || eclass.subject.name === subjectQuery);
      filterDescriptions.push(pupa(config.messages.subjectFilter, { value: subjectQuery }));
    }

    const filterDescription = filterDescriptions.length > 0
      ? pupa(config.messages.filterTitle, { filters: filterDescriptions.join('\n') })
      : config.messages.noFilter;

    // Change the ".every" to ".some" to have a "OR" between the filters, rather than "AND".
    const filteredClasses = eclasses.filter(eclass => filters.every(filt => filt(eclass)));

    const baseEmbed = new MessageEmbed()
      .setTitle(config.messages.listTitle)
      .setColor(settings.colors.default);

    if (filteredClasses.length === 0) {
      await message.channel.send({ embeds: [baseEmbed.setDescription(`${filterDescription}${config.messages.noClassesFound}`)] });
      return;
    }

    await new PaginatedMessageEmbedFields()
      .setTemplate(
        baseEmbed.setDescription(`${filterDescription}${config.messages.someClassesFound(filteredClasses.length)}`),
      )
      .setItems(
        filteredClasses.map((eclass) => {
          const eclassInfos = {
            ...eclass.toJSON(),
            ...eclass.normalizeDates(true),
            status: capitalize(config.messages.rawStatuses[eclass.status]),
            where: config.messages.where(eclass),
          };
          return {
            name: pupa(config.messages.listFieldTitle, eclassInfos),
            value: pupa(config.messages.listFieldDescription, eclassInfos),
          };
        }),
      )
      .setItemsPerPage(3)
      .make()
      .run(message, message.author);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields([...config.messages.helpEmbedDescription])
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
