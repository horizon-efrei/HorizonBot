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
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import { massSend, noop, nullop } from '@/utils';

const classAnnouncement: Record<AnnouncementSchoolYear, ConfigEntriesChannels> = {
  [SchoolYear.L1]: ConfigEntriesChannels.ClassAnnouncementL1,
  [SchoolYear.L2]: ConfigEntriesChannels.ClassAnnouncementL2,
  [SchoolYear.L3]: ConfigEntriesChannels.ClassAnnouncementL3,
  general: ConfigEntriesChannels.ClassAnnouncementGeneral,
};

export async function updateGlobalAnnouncements(guildId: string, schoolYear: SchoolYear): Promise<void> {
  await EclassMessagesManager.updateUpcomingClassesForGuild(guildId);
  await EclassMessagesManager.updateClassesCalendarForGuildAndSchoolYear(guildId, schoolYear);
}

export function createAnnouncementEmbed({
  subject,
  topic,
  formattedDate,
  duration,
  professor,
  classChannel,
  classId,
  isRecorded,
}: EclassEmbedOptions): MessageEmbed {
  const texts = config.messages.newClassEmbed;
  return new MessageEmbed()
    .setColor(settings.colors.green)
    .setTitle(pupa(texts.title, { subject, topic }))
    .setDescription(pupa(texts.description, { subject, classChannel }))
    .setThumbnail(subject.emojiImage)
    .setAuthor(texts.author, classChannel.guild.iconURL())
    .addField(texts.date, formattedDate, true)
    .addField(texts.duration, dayjs.duration(duration).humanize(), true)
    .addField(texts.professor, professor.toString(), true)
    .addField(texts.recorded, texts.recordedValues[Number(isRecorded)], true)
    .setFooter(pupa(texts.footer, { classId }));
}

export async function createClass(
  message: GuildMessage,
  {
    date, subject, topic, duration, professor, targetRole, isRecorded,
  }: EclassCreationOptions,
): Promise<void> {
  // Prepare the date
  const formattedDate = dayjs(date).format(settings.configuration.dateFormat);

  const roleName = pupa(settings.configuration.eclassRoleFormat, { subject, topic, formattedDate });
  if (message.guild.roles.cache.some(r => r.name === roleName)) {
    await message.channel.send(config.messages.alreadyExists);
    return;
  }

  // Get the corresponding channels
  const announcementChannel = await container.client.configManager
    .get(classAnnouncement[subject.schoolYear], message.guild.id);
  if (!announcementChannel) {
    container.logger.warn(`[e-class:not-created] A new e-class was planned but no announcement channel was found, unable to create. Setup an announcement channel with "${settings.prefix}setup class"`);
    await message.channel.send(config.messages.unconfiguredChannel);
    return;
  }

  const classChannel = await message.guild.channels.fetch(subject.textChannel) as GuildTextBasedChannel;

  // Create & send the announcement embed
  const embed = createAnnouncementEmbed({
    subject,
    topic,
    formattedDate,
    duration,
    professor,
    classChannel,
    classId: '',
    isRecorded,
  });
  const announcementMessage = await announcementChannel.send({
    content: pupa(config.messages.newClassNotification, { targetRole }),
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
    announcementMessage: announcementMessage.id,
    announcementChannel: classAnnouncement[subject.schoolYear],
    classId,
    isRecorded,
  });
  // Use the newly created ID in the embed
  await announcementMessage.edit({
    content: announcementMessage.content,
    embeds: [embed.setFooter(pupa(config.messages.newClassEmbed.footer, eclass))],
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
    .setAuthor(texts.author, announcementChannel.guild.iconURL())
    .setDescription(pupa(texts.baseDescription, {
      eclass,
      isRecorded: eclass.isRecorded ? texts.descriptionIsRecorded : texts.descriptionIsNotRecorded,
      textChannels: pupa(
        eclass.subject.voiceChannel ? texts.descriptionAllChannels : texts.descriptionTextChannel, { eclass },
      ),
    }))
    .setFooter(pupa(texts.footer, eclass));

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
  announcementEmbed.spliceFields(0, 25);
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

export async function setRecordLink(eclass: EclassPopulatedDocument, link: string): Promise<void> {
  // Fetch the announcement message
  const announcementChannel = await container.client.configManager
    .get(eclass.announcementChannel, eclass.guild);
  const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);

  // Update its embed
  const announcementEmbed = announcementMessage.embeds[0];
  announcementEmbed.fields
    .find(field => field.name === config.messages.newClassEmbed.recorded)
    .value += pupa(config.messages.newClassEmbed.recordedLink, { link });
  await announcementMessage.edit({ embeds: [announcementEmbed] });

  // Send the link in the corresponding text channel
  const classChannel = container.client
    .guilds.resolve(eclass.guild)
    .channels.resolve(eclass.subject.textChannel) as GuildTextBasedChannel;
  await classChannel.send(pupa(config.messages.linkAnnouncement, { link }));

  // Store the link in the DB
  await Eclass.findByIdAndUpdate(eclass._id, { recordLink: link });

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
  const beforeChecklist = [
    eclass.isRecorded ? config.messages.alertProfessorComplements.startRecord : null,
    pupa(eclass.subject.voiceChannel
      ? config.messages.alertProfessorComplements.connectVoiceChannel
      : config.messages.alertProfessorComplements.announceVoiceChannel, eclass),
  ].filter(Boolean).join('\n');

  await professor?.send(
    pupa(config.messages.alertProfessor, {
      ...eclass.toJSON(),
      date: Math.floor(eclass.date / 1000),
      beforeChecklist,
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
  await classChannel.send(
    pupa(config.messages.remindClassNotification, {
      classRole: eclass.classRole,
      duration: dayjs.duration(settings.configuration.eclassReminderTime).humanize(),
    }),
  );
  // Send the private message to the subscribers
  await massSend(guild, eclass.subscribers, pupa(config.messages.remindClassPrivateNotification, eclass));

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

  await Eclass.findByIdAndUpdate(eclass._id, { $push: { subscribers: member.id } });
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

export function validateDate(date: Date): boolean {
  return dayjs(date).isBetween(dayjs(), dayjs().add(2, 'months'));
  }
