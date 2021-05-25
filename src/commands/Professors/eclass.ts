import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import dayjs from 'dayjs';
import type { GuildMember, Role } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import EclassManager from '@/structures/EclassManager';
import MonkaSubCommand from '@/structures/MonkaSubCommand';
import type { GuildMessage, GuildTextBasedChannel, HourMinutes } from '@/types';
import { EclassStatus } from '@/types/database';
import { generateSubcommands, nullop } from '@/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  strategyOptions: {
    flags: ['ping'],
  },
  subCommands: generateSubcommands({
    create: { aliases: ['add'] },
    setup: { aliases: ['build', 'make'] },
    start: { aliases: ['begin'] },
    edit: { aliases: ['modify'] },
    cancel: { aliases: ['archive'] },
    finish: { aliases: ['end'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class EclassCommand extends MonkaSubCommand {
  public async create(message: GuildMessage, args: Args): Promise<void> {
    if (!message.member.roles.cache.has(settings.roles.eprof)) {
      await message.channel.send(config.messages.onlyProfessor);
      return;
    }

    const classChannel = await args.pickResult('guildTextBasedChannel');
    if (classChannel.error) {
      await message.channel.send(config.messages.prompts.classChannel.invalid);
      return;
    }

    const topic = await args.pickResult('string');
    if (topic.error) {
      await message.channel.send(config.messages.prompts.topic.invalid);
      return;
    }

    const date = await args.pickResult('day');
    if (date.error) {
      await message.channel.send(config.messages.prompts.date.invalid);
      return;
    }

    const hour = await args.pickResult('hour');
    if (hour.error) {
      await message.channel.send(config.messages.prompts.hour.invalid);
      return;
    }

    date.value.setHours(hour.value.hour);
    date.value.setMinutes(hour.value.minutes);
    if (!dayjs(date.value).isBetween(dayjs(), dayjs().add(2, 'month'))) {
      await message.channel.send(config.messages.invalidDate);
      return;
    }

    const duration = await args.pickResult('duration');
    if (duration.error) {
      await message.channel.send(config.messages.prompts.duration.invalid);
      return;
    }

    const professor = await args.pickResult('member');
    if (professor.error) {
      await message.channel.send(config.messages.prompts.professor.invalid);
      return;
    }

    const targetRole = await args.pickResult('role');
    if (targetRole.error) {
      await message.channel.send(config.messages.prompts.targetRole.invalid);
      return;
    }

    await EclassManager.createClass(message, {
      date: date.value,
      classChannel: classChannel.value,
      topic: topic.value,
      duration: duration.value,
      professor: professor.value,
      targetRole: targetRole.value,
    });
  }

  public async setup(message: GuildMessage): Promise<void> {
    if (!message.member.roles.cache.has(settings.roles.eprof)) {
      await message.channel.send(config.messages.onlyProfessor);
      return;
    }

    let classChannel: GuildTextBasedChannel;
    let topic: string;
    let date: Date;
    let hour: HourMinutes;
    let duration: number;
    let professor: GuildMember;
    let targetRole: Role;

    try {
      const allMessages: GuildMessage[] = [];
      const prompter = new ArgumentPrompter(message, allMessages);

      classChannel = await prompter.autoPromptTextChannel(config.messages.prompts.classChannel);
      topic = await prompter.autoPromptText(config.messages.prompts.topic);
      date = await prompter.autoPromptDate(config.messages.prompts.date);
      hour = await prompter.autoPromptHour(config.messages.prompts.hour);
      date.setHours(hour.hour);
      date.setMinutes(hour.minutes);
      while (!dayjs(date).isBetween(dayjs(), dayjs().add(2, 'month'))) {
        await message.channel.send(config.messages.invalidDate);
        date = await prompter.autoPromptDate(config.messages.prompts.date);
        hour = await prompter.autoPromptHour(config.messages.prompts.hour);
        date.setHours(hour.hour);
        date.setMinutes(hour.minutes);
      }
      duration = await prompter.autoPromptDuration(config.messages.prompts.duration);
      professor = await prompter.autoPromptMember(config.messages.prompts.professor);
      targetRole = await prompter.autoPromptRole(config.messages.prompts.targetRole);
    } catch (error: unknown) {
      if ((error as Error).message === 'STOP') {
        await message.channel.send(messages.prompts.stoppedPrompting);
        return;
      }
      throw error;
    }

    await EclassManager.createClass(message, {
      date,
      classChannel,
      topic,
      duration,
      professor,
      targetRole,
    });
  }

  public async start(message: GuildMessage, args: Args): Promise<void> {
    // Get the class ID
    const classId = await args.pickResult('string');
    if (classId.error) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Fetch the class document from the database
    const eclass = await Eclass.findOne({ classId: classId.value });
    if (!eclass) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Check if the professor is the right one
    if (message.member.id !== eclass.professor && message.member.roles.cache.has(settings.roles.staff)) {
      await message.channel.send(config.messages.editUnauthorized);
      return;
    }

    // If the class is already started/finished/cancel, you cannot start it.
    if (eclass.status !== EclassStatus.Planned) {
      await message.channel.send(pupa(config.messages.alreadyStarted, { status: EclassManager.toStatus(eclass) }));
      return;
    }

    // Fetch the member
    const professor = await message.guild.members.fetch(eclass.professor).catch(nullop);
    if (!professor) {
      await message.channel.send(config.messages.unresolvedProfessor);
      return;
    }

    // Start the class & confirm.
    await EclassManager.startClass(eclass);
    await message.channel.send(config.messages.successfullyStarted);
    // TODO: Send messages to members in DM
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send(embed);
  }

  // eslint-disable-next-line complexity
  public async edit(message: GuildMessage, args: Args): Promise<void> {
    // Get the class ID
    const classId = await args.pickResult('string');
    if (classId.error) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Fetch the class document from the database
    let eclass = await Eclass.findOne({ classId: classId.value });
    if (!eclass) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Check if the professor is the right one
    if (message.member.id !== eclass.professor && message.member.roles.cache.has(settings.roles.staff)) {
      await message.channel.send(config.messages.editUnauthorized);
      return;
    }

    // If the class is already started/finished/cancel, you cannot edit it.
    if (eclass.status !== EclassStatus.Planned) {
      await message.channel.send(pupa(config.messages.notEditable, { status: EclassManager.toStatus(eclass) }));
      return;
    }

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

      default:
        await message.channel.send(config.messages.invalidEditProperty);
        return;
    }

    // Fetch the annoucement message
    const originalChannel = await this.context.client.configManager.get(message.guild.id, eclass.announcementChannel);
    const originalMessage = await originalChannel.messages.fetch(eclass.announcementMessage);

    // Edit the announcement embed
    const formattedDate = dayjs(eclass.date).format(settings.configuration.dateFormat);
    const classChannel = message.guild.channels.resolve(eclass.classChannel) as GuildTextBasedChannel;
    const { subject, topic, duration } = eclass;
    await originalMessage.edit({
      content: originalMessage.content,
      embed: EclassManager.createAnnoucementEmbed({
        subject,
        topic,
        formattedDate,
        duration,
        professor: await message.guild.members.fetch(eclass.professor),
        classChannel,
        classId: classId.value,
      }),
    });
    // Edit the role
    const originalRole = message.guild.roles.resolve(eclass.classRole);
    const newRoleName = pupa(settings.configuration.eclassRoleFormat, { subject, topic, formattedDate });
    if (originalRole.name !== newRoleName)
      await originalRole.setName(newRoleName);

    // Send messages
    const payload = {
      eclass: { ...eclass.toData(), role: message.guild.roles.resolve(eclass.targetRole).name },
    };
    await message.channel.send(pupa(updateMessage, payload));
    if (shouldPing)
      await classChannel.send(pupa(notificationMessage, payload));
  }

  public async cancel(message: GuildMessage, args: Args): Promise<void> {
    // Get the class ID
    const classId = await args.pickResult('string');
    if (classId.error) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Fetch the class document from the database
    const eclass = await Eclass.findOne({ classId: classId.value });
    if (!eclass) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Check if the professor is the right one
    if (message.member.id !== eclass.professor && message.member.roles.cache.has(settings.roles.staff)) {
      await message.channel.send(config.messages.cancelUnauthorized);
      return;
    }

    // If the class is already canceled/finished, you cannot cancel it.
    if (eclass.status === EclassStatus.Canceled || eclass.status === EclassStatus.Finished) {
      await message.channel.send(pupa(config.messages.notCancellable, { status: EclassManager.toStatus(eclass) }));
      return;
    }

    // Cancel the class & confirm.
    await EclassManager.cancelClass(eclass);
    await message.channel.send(config.messages.successfullyCanceled);
  }

  public async finish(message: GuildMessage, args: Args): Promise<void> {
    // Get the class ID
    const classId = await args.pickResult('string');
    if (classId.error) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Fetch the class document from the database
    const eclass = await Eclass.findOne({ classId: classId.value });
    if (!eclass) {
      await message.channel.send(config.messages.invalidClassId);
      return;
    }

    // Check if the professor is the right one
    if (message.member.id !== eclass.professor && message.member.roles.cache.has(settings.roles.staff)) {
      await message.channel.send(config.messages.finishUnauthorized);
      return;
    }

    // If the class is not started, you cannot finish it.
    if (eclass.status !== EclassStatus.InProgress) {
      await message.channel.send(config.messages.notFinishable);
      return;
    }

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
}
