import { ApplyOptions } from '@sapphire/decorators';
import { MessagePrompter } from '@sapphire/discord.js-utilities';
import { Args, Resolvers } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { isNullish } from '@sapphire/utilities';
import dayjs from 'dayjs';
import type { GuildMember, Role } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';

import { eclass as config } from '@/config/commands/professors';
import messages from '@/config/messages';
import settings from '@/config/settings';
import { IsEprofOrStaff, ValidateEclassArgument } from '@/decorators';
import EclassInteractiveBuilder from '@/eclasses/EclassInteractiveBuilder';
import EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import PaginatedMessageEmbedFields from '@/structures/PaginatedMessageEmbedFields';
import MonkaSubCommand from '@/structures/commands/MonkaSubCommand';
import { GuildMessage } from '@/types';
import type { GuildTextBasedChannel } from '@/types';
import { EclassPopulatedDocument, EclassStatus } from '@/types/database';
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
  flags: ['ping'],
  options: Object.values(listOptions).flat(),
  subCommands: generateSubcommands({
    create: { aliases: ['add', 'make', 'new'] },
    start: { aliases: ['begin'] },
    edit: { aliases: ['modify'] },
    cancel: { aliases: ['archive'] },
    finish: { aliases: ['end', 'stop'] },
    record: { aliases: ['enregistrement', 'link', 'lien', 'replay', 'recording'] },
    list: { aliases: ['liste', 'ls'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class EclassCommand extends MonkaSubCommand {
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
        const newDate = await args.pickResult('day');
        if (newDate.error) {
          await message.channel.send(config.messages.prompts.date.invalid);
          return;
        }

        const date = new Date(eclass.date);
        date.setMonth(newDate.value.getMonth());
        date.setDate(newDate.value.getDate());

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { date: date.getTime(), end: date.getTime() + eclass.duration },
          { new: true },
        );
        updateMessage = config.messages.editedDate;
        notificationMessage = config.messages.pingEditedDate;
        break;
      }

      case 'hour':
      case 'heure': {
        const newHour = await args.pickResult('hour');
        if (newHour.error) {
          await message.channel.send(config.messages.prompts.hour.invalid);
          return;
        }

        const date = new Date(eclass.date);
        date.setHours(newHour.value.hour);
        date.setMinutes(newHour.value.minutes);

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { date: date.getTime(), end: date.getTime() + eclass.duration },
          { new: true },
        );
        updateMessage = config.messages.editedHour;
        notificationMessage = config.messages.pingEditedHour;
        break;
      }

      case 'duration':
      case 'duree':
      case 'durée': {
        const duration = await args.pickResult('duration');
        if (duration.error) {
          await message.channel.send(config.messages.prompts.duration.invalid);
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
        const professor = await args.pickResult('member');
        if (professor.error) {
          await message.channel.send(config.messages.prompts.professor.invalid);
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

      case 'role':
      case 'rôle': {
        const targetRole = await args.pickResult('role');
        if (targetRole.error) {
          await message.channel.send(config.messages.prompts.targetRole.invalid);
          return;
        }

        eclass = await Eclass.findByIdAndUpdate(
          eclass._id,
          { targetRole: targetRole.value.id },
          { new: true },
        );
        updateMessage = config.messages.editedRole;
        notificationMessage = config.messages.pingEditedRole;
        break;
      }

      case 'record':
      case 'recorded':
      case 'enregistre':
      case 'enregistré': {
        const isRecorded = await args.pickResult('boolean');
        if (isRecorded.error) {
          await message.channel.send(config.messages.prompts.recorded.invalid);
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
        subject: eclass.subject,
        topic: eclass.topic,
        formattedDate,
        duration: eclass.duration,
        professor: await message.guild.members.fetch(eclass.professor),
        classChannel,
        classId: eclass.classId,
        isRecorded: eclass.isRecorded,
      })],
    });

    // Edit the role
    const { subject, topic } = eclass;
    const originalRole = message.guild.roles.resolve(eclass.classRole);
    const newRoleName = pupa(settings.configuration.eclassRoleFormat, { subject, topic, formattedDate });
    if (originalRole.name !== newRoleName)
      await originalRole.setName(newRoleName);

    // Send messages
    const payload = {
      ...eclass.toData(),
      role: message.guild.roles.resolve(eclass.targetRole).name,
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
      timeout: 60 * 1000,
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
    await EclassManager.setRecordLink(eclass, link.value.toString());
    await message.channel.send(config.messages.successfullyAddedLink);
  }

  public async list(message: GuildMessage, args: Args): Promise<void> {
    // TODO: Add filter by date (before/after)
    // TODO: Add ability to combine same filters with each-other
    const eclasses: EclassPopulatedDocument[] = await Eclass.find({ guild: message.guild.id });

    const filterDescriptions: string[] = [];
    let statusValue: EclassStatus;
    let professorValue: GuildMember;
    let roleValue: Role;
    let subjectValue: string;

    const statusQuery = args.getOption(...listOptions.status);
    if (statusQuery) {
      statusValue = statusOptionValues.find(([keys]) => keys.includes(statusQuery))?.[1];
      filterDescriptions.push(pupa(config.messages.statusFilter, { value: config.messages.rawStatuses[statusValue] }));
    }

    const professorQuery = args.getOption(...listOptions.professor);
    if (professorQuery) {
      professorValue = (await Resolvers.resolveMember(professorQuery, message.guild))?.value;
      filterDescriptions.push(pupa(config.messages.professorFilter, { value: professorValue }));
    }

    const roleQuery = args.getOption(...listOptions.role);
    if (roleQuery) {
      roleValue = (await Resolvers.resolveRole(roleQuery, message.guild))?.value;
      filterDescriptions.push(pupa(config.messages.roleFilter, { value: roleValue }));
    }

    const subjectQuery = args.getOption(...listOptions.subject);
    if (subjectQuery) {
      subjectValue = subjectQuery;
      filterDescriptions.push(pupa(config.messages.subjectFilter, { value: subjectValue }));
    }

    const filterDescription = filterDescriptions.length > 0
      ? pupa(config.messages.filterTitle, { filters: filterDescriptions.join('\n') })
      : config.messages.noFilter;

    const filters: Array<(eclass: EclassPopulatedDocument) => boolean> = [
      (eclass): boolean => (isNullish(statusValue) ? true : eclass.status === statusValue),
      (eclass): boolean => (isNullish(professorValue) ? true : eclass.professor === professorValue.id),
      (eclass): boolean => (isNullish(roleValue) ? true : eclass.targetRole === roleValue.id),
      (eclass): boolean => (isNullish(subjectValue)
        ? true
        : (eclass.subject.classCode === subjectValue || eclass.subject.name === subjectValue)),
    ];
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
            status: capitalize(config.messages.rawStatuses[eclass.status]),
            date: Math.floor(eclass.date / 1000),
            duration: dayjs.duration(eclass.duration).humanize(),
            end: Math.floor(eclass.end / 1000),
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
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
