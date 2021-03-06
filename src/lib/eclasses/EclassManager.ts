import { EmbedLimits, RoleLimits } from '@sapphire/discord-utilities';
import { container } from '@sapphire/pieces';
import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import * as EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Eclass from '@/models/eclass';
import type {
  AnnouncementSchoolYear,
  EclassCreationOptions,
  EclassEmbedOptions,
  GuildMessage,
  GuildTextBasedChannel,
} from '@/types';
import { SchoolYear } from '@/types';
import type { EclassPopulatedDocument } from '@/types/database';
import {
  ConfigEntriesChannels,
  ConfigEntriesRoles,
  EclassPlace,
  EclassStatus,
} from '@/types/database';
import {
  massSend,
  noop,
  nullop,
  trimText,
} from '@/utils';

const classAnnouncement: Record<AnnouncementSchoolYear, ConfigEntriesChannels> = {
  [SchoolYear.L1]: ConfigEntriesChannels.ClassAnnouncementL1,
  [SchoolYear.L2]: ConfigEntriesChannels.ClassAnnouncementL2,
  [SchoolYear.L3]: ConfigEntriesChannels.ClassAnnouncementL3,
  general: ConfigEntriesChannels.ClassAnnouncementGeneral,
};

const schoolYearRoles: Record<SchoolYear, ConfigEntriesRoles> = {
  [SchoolYear.L1]: ConfigEntriesRoles.SchoolYearL1,
  [SchoolYear.L2]: ConfigEntriesRoles.SchoolYearL2,
  [SchoolYear.L3]: ConfigEntriesRoles.SchoolYearL3,
};

export async function updateGlobalAnnouncements(guildId: string, schoolYear: SchoolYear): Promise<void> {
  await EclassMessagesManager.updateUpcomingClassesForGuild(guildId);
  await EclassMessagesManager.updateClassesCalendarForGuildAndSchoolYear(guildId, schoolYear);
}

export function createAnnouncementEmbed({
  classChannel,
  classId,
  date,
  duration,
  end,
  isRecorded,
  professor,
  subject,
  topic,
  place,
  placeInformation,
}: EclassEmbedOptions): MessageEmbed {
  const texts = config.messages.newClassEmbed;
  return new MessageEmbed()
    .setColor(settings.colors.green)
    .setTitle(pupa(texts.title, { subject, topic }))
    .setDescription(pupa(texts.description, { subject, classChannel, date }))
    .setThumbnail(subject.emojiImage)
    .setAuthor({ name: texts.author, iconURL: classChannel.guild.iconURL() })
    .addField(texts.date, pupa(texts.dateValue, { date, end }), true)
    .addField(texts.duration, dayjs.duration(duration).humanize(), true)
    .addField(texts.professor, professor.toString(), true)
    .addField(texts.recorded, config.messages.recordedValues[Number(isRecorded)], true)
    .addField(texts.place, pupa(texts.placeValues[place], { place, placeInformation, subject }), true)
    .setFooter({ text: pupa(texts.footer, { classId }) });
}

export function getRoleNameForClass(
  { formattedDate, subject, topic }: Pick<EclassCreationOptions, 'subject' | 'topic'> & { formattedDate: string },
): string {
  const baseRoleName = pupa(settings.configuration.eclassRoleFormat, { subject, topic: '{topic}', formattedDate });
  const remainingLength = RoleLimits.MaximumNameLength - baseRoleName.length + '{topic}'.length;
  return pupa(baseRoleName, { topic: trimText(topic, remainingLength) });
}

export async function createClass(
  message: GuildMessage,
  {
    date, subject, topic, duration, professor, isRecorded, targetRole, place, placeInformation,
  }: EclassCreationOptions,
): Promise<void> {
  // Prepare the date
  const formattedDate = dayjs(date).format(settings.configuration.dateFormat);

  targetRole ??= await container.client.configManager.get(schoolYearRoles[subject.schoolYear], message.guild.id);
  if (!targetRole) {
    container.logger.warn('[e-class:not-created] A new e-class was planned but no school year role found, unable to create.');
    await message.channel.send(config.messages.unconfiguredRole);
    return;
  }

  const roleName = getRoleNameForClass({ formattedDate, subject, topic });
  if (message.guild.roles.cache.some(r => r.name === roleName)) {
    await message.channel.send(config.messages.alreadyExists);
    return;
  }

  // Get the corresponding channels
  const announcementChannel = await container.client.configManager
    .get(classAnnouncement[subject.schoolYear], message.guild.id);
  if (!announcementChannel) {
    container.logger.warn('[e-class:not-created] A new e-class was planned but no announcement channel was found, unable to create.');
    await message.channel.send(config.messages.unconfiguredChannel);
    return;
  }

  const classChannel = await message.guild.channels.fetch(subject.textChannel) as GuildTextBasedChannel;

  // Create & send the announcement embed
  const embed = createAnnouncementEmbed({
    classChannel,
    classId: 'Cr??ation en cours...',
    date: Math.floor(date.getTime() / 1000),
    duration,
    end: Math.floor((date.getTime() + duration) / 1000),
    isRecorded,
    professor,
    subject,
    topic,
    place,
    placeInformation,
  });

  const newClassNotificationPlaceAlert = place === EclassPlace.Discord
    ? ''
    : pupa(config.messages.newClassNotificationPlaceAlert, {
        where: config.messages.where({ place, placeInformation, subject }),
      });

  const announcementMessage = await announcementChannel.send({
    content: pupa(config.messages.newClassNotification, {
      targetRole,
      newClassNotificationPlaceAlert,
    }),
    embeds: [embed],
  });
  // Add the reaction & cache the message
  await announcementMessage.react(settings.emojis.yes);
  if (announcementMessage.crosspostable)
    await announcementMessage.crosspost();
  container.client.eclassRolesIds.add(announcementMessage.id);

  // Create the role
  const role = await message.guild.roles.create({ name: roleName, color: settings.colors.white, mentionable: true });

  // Add the class to the database
  const classId = Eclass.generateId(professor, date);
  const eclass = await Eclass.create({
    classChannel: classChannel.id,
    guild: classChannel.guild.id,
    topic,
    subject,
    date: date.getTime(),
    duration,
    professor: professor.id,
    classRole: role.id,
    targetRole: targetRole.id,
    place,
    placeInformation,
    announcementMessage: announcementMessage.id,
    announcementChannel: classAnnouncement[subject.schoolYear],
    classId,
    isRecorded,
  });
  // Use the newly created ID in the embed
  await announcementMessage.edit({
    content: announcementMessage.content,
    embeds: [embed.setFooter({ text: pupa(config.messages.newClassEmbed.footer, eclass) })],
  });

  // Edit the global announcement messages (calendar & week upcoming classes)
  await updateGlobalAnnouncements(eclass.guild, subject.schoolYear);

  // Send confirmation message
  await message.channel.send(pupa(config.messages.successfullyCreated, { eclass }));

  container.logger.debug(`[e-class:${classId}] Created eclass.`);
}

export async function startClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager
    .get(eclass.announcementChannel, eclass.guild);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  announcementEmbed.setColor(settings.colors.orange);
  announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date).value += ` ${config.messages.valueInProgress}`;
  await announcementMessage.edit({ embeds: [announcementEmbed] });
  await announcementMessage.reactions.removeAll();

  // Send an embed in the corresponding text channel
  const classChannel = container.client
    .guilds.resolve(eclass.guild)
    .channels.resolve(eclass.subject.textChannel) as GuildTextBasedChannel;

  const texts = config.messages.startClassEmbed;
  const embed = new MessageEmbed()
    .setColor(settings.colors.primary)
    .setTitle(pupa(texts.title, { eclass }))
    .setAuthor({ name: texts.author, iconURL: announcementChannel.guild.iconURL() })
    .setDescription(pupa(texts.baseDescription, {
      eclass,
      isRecorded: eclass.isRecorded ? texts.descriptionIsRecorded : texts.descriptionIsNotRecorded,
      textChannels: pupa(
        eclass.subject.voiceChannel ? texts.descriptionAllChannels : texts.descriptionTextChannel, { eclass },
      ),
      where: config.messages.where(eclass),
    }))
    .setFooter({ text: pupa(texts.footer, eclass) });

  await classChannel.send({
    content: pupa(config.messages.startClassNotification, { classRole: eclass.classRole }),
    embeds: [embed],
  });

  // Mark the class as In Progress
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.InProgress });

  container.logger.debug(`[e-class:${eclass.classId}] Started class.`);
}

export async function finishClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager
    .get(eclass.announcementChannel, eclass.guild);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  const statusField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date);
  statusField.value = statusField.value.replace(config.messages.valueInProgress, config.messages.valueFinished);
  await announcementMessage.edit({ embeds: [announcementEmbed] });

  // Remove the associated role
  await container.client
    .guilds.cache.get(eclass.guild)
    .roles.cache.get(eclass.classRole)
    .delete('Class finished');

  // Mark the class as finished
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Finished });

  // Edit the global announcement messages (calendar & week upcoming classes)
  await updateGlobalAnnouncements(eclass.guild, eclass.subject.schoolYear);

  container.logger.debug(`[e-class:${eclass.classId}] Ended class.`);
}

export async function cancelClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager
    .get(eclass.announcementChannel, eclass.guild);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  announcementEmbed.setColor(settings.colors.red);
  announcementEmbed.setDescription(config.messages.valueCanceled);
  announcementEmbed.spliceFields(0, EmbedLimits.MaximumFields);
  await announcementMessage.edit({ embeds: [announcementEmbed] });
  await announcementMessage.reactions.removeAll();

  // Remove from cache
  container.client.eclassRolesIds.delete(announcementMessage.id);

  // Remove the associated role
  await container.client
    .guilds.cache.get(eclass.guild)
    .roles.cache.get(eclass.classRole)
    .delete('Class canceled');

  // Mark the class as finished
  await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Canceled });

  // Edit the global announcement messages (calendar & week upcoming classes)
  await updateGlobalAnnouncements(eclass.guild, eclass.subject.schoolYear);

  container.logger.debug(`[e-class:${eclass.classId}] Canceled class.`);
}

export async function setRecordLink(
  eclass: EclassPopulatedDocument,
  recordLink: string,
  silent = false,
): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager
    .get(eclass.announcementChannel, eclass.guild);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  const recordField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.recorded);

  const baseValue = config.messages.recordedValues[Number(eclass.isRecorded)];
  const linkValue = pupa(config.messages.recordedLink, { recordLink });
  recordField.value = `${baseValue}\n${linkValue}`;

  await announcementMessage.edit({ embeds: [announcementEmbed] });

  if (!silent) {
    // Send the link in the corresponding text channel
    const classChannel = container.client
      .guilds.resolve(eclass.guild)
      .channels.resolve(eclass.subject.textChannel) as GuildTextBasedChannel;
    await classChannel.send(pupa(config.messages.linkAnnouncement, {
      topic: eclass.topic,
      date: dayjs(eclass.date).format(settings.configuration.dateFormat),
      link: recordLink,
    }));
  }

  // Store the link in the DB
  await Eclass.findByIdAndUpdate(eclass._id, { recordLink });

  container.logger.debug(`[e-class:${eclass.classId}] Added record link.`);
}

export async function remindClass(eclass: EclassPopulatedDocument): Promise<void> {
  // Mark the reminder as sent
  await Eclass.findByIdAndUpdate(eclass._id, { reminded: true });

  // Resolve the associated channel
  const guild = container.client.guilds.resolve(eclass.guild);
  const classChannel = guild.channels.resolve(eclass.subject.textChannel) as GuildTextBasedChannel;

  // Alert the professor
  const professor = await guild.members.fetch({ user: eclass.professor, cache: false }).catch(nullop);

  await professor?.send(
    pupa(config.messages.alertProfessor, {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(),
      where: config.messages.where(eclass),
      beforeChecklist: eclass.isRecorded
        ? config.messages.alertProfessorComplements.startRecord
        : '',
      afterChecklist: eclass.isRecorded
        ? pupa(config.messages.alertProfessorComplements.registerRecording, eclass)
        : '',
      isIsNot: eclass.isRecorded
        ? config.messages.alertProfessorComplements.isRecorded
        : config.messages.alertProfessorComplements.isNotRecorded,
      notIsRecorded: (!eclass.isRecorded).toString(),
    }),
  ).catch(nullop);

  // Send the notification to the eclass channel
  const payload = {
    ...eclass.toJSON(),
    ...eclass.normalizeDates(),
    where: config.messages.where(eclass),
  };
  await classChannel.send(pupa(config.messages.remindClassNotification, payload));

  // Send the private message to the subscribers
  const reminder = pupa(config.messages.remindClassPrivateNotification, payload);
  await massSend(guild, eclass.subscribers, reminder);

  container.logger.debug(`[e-class:${eclass.classId}] Sent reminders.`);
}

export async function subscribeMember(member: GuildMember, eclass: EclassPopulatedDocument): Promise<void> {
  if (eclass.status !== EclassStatus.Planned)
    return;
  if (eclass.professor === member.id)
    return;

  const givenRole = member.guild.roles.cache.get(eclass.classRole);
  if (!givenRole) {
    container.logger.warn(`[e-class:${eclass.classId}] The role with id ${eclass.classRole} does not exist.`);
    return;
  }

  await Eclass.findByIdAndUpdate(eclass._id, { $addToSet: { subscribers: member.id } });
  if (!member.roles.cache.get(givenRole.id))
    await member.roles.add(givenRole);

  member.send(pupa(config.messages.subscribed, eclass)).catch(noop);

  container.logger.debug(`[e-class:${eclass.classId}] Subscribed member ${member.id} (${member.user.tag}).`);
}

export async function unsubscribeMember(member: GuildMember, eclass: EclassPopulatedDocument): Promise<void> {
  if (eclass.status !== EclassStatus.Planned)
    return;

  const givenRole = member.guild.roles.cache.get(eclass.classRole);
  if (!givenRole) {
    container.logger.warn(`[e-class:${eclass.classId}] The role with id ${eclass.classRole} does not exist.`);
    return;
  }

  await Eclass.findByIdAndUpdate(eclass._id, { $pull: { subscribers: member.id } });
  if (member.roles.cache.get(givenRole.id))
    await member.roles.remove(givenRole);

  member.send(pupa(config.messages.unsubscribed, eclass)).catch(noop);

  container.logger.debug(`[e-class:${eclass.classId}] Unsubscribed member ${member.id} (${member.user.tag}).`);
}

export function validateDateSpan(date: Date): boolean {
  return dayjs(date).isBetween(dayjs(), dayjs().add(2, 'months'));
}

export async function checkOverlaps(
  start: Date,
  endOrDuration: Date | number,
  metadata: { schoolYear: SchoolYear; professorId: string },
): Promise<{ professorOverlap: boolean;schoolYearOverlap: boolean; any: boolean; error: string | null }> {
  const myStart = start.getTime();
  const myEnd = typeof endOrDuration === 'number'
    ? myStart + endOrDuration
    : endOrDuration.getTime();

  const allOverlapping = await Eclass.find<EclassPopulatedDocument>({
    status: EclassStatus.Planned,
    date: { $lte: myEnd },
    end: { $gte: myStart },
  });

  const schoolYearOverlap = allOverlapping.some(eclass => eclass.subject.schoolYear === metadata.schoolYear);
  const professorOverlap = allOverlapping.some(eclass => eclass.professor === metadata.professorId);

  return {
    professorOverlap,
    schoolYearOverlap,
    any: professorOverlap || schoolYearOverlap,
    error: schoolYearOverlap
      ? config.messages.prompts.date.schoolYearOverlap
      : professorOverlap
      ? config.messages.prompts.date.professorOverlap
      : null,
  };
}
