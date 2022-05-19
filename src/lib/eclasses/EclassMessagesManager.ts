import { time, TimestampStyles } from '@discordjs/builders';
import { EmbedLimits, MessageLimits } from '@sapphire/discord-utilities';
import { container } from '@sapphire/pieces';
import { isNullish } from '@sapphire/utilities';
import { oneLine } from 'common-tags';
import dayjs from 'dayjs';
import type { MessageOptions } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import drop from 'lodash.drop';
import groupBy from 'lodash.groupby';
import take from 'lodash.take';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import Subject from '@/models/subject';
import { SchoolYear } from '@/types';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import type { EclassDocument, EclassPopulatedDocument, SubjectDocument } from '@/types/database';
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import {
  capitalize,
  nullop,
  promiseTimeout,
  splitText,
} from '@/utils';

const calendarMapping = {
  [SchoolYear.L1]: ConfigEntriesChannels.ClassCalendarL1,
  [SchoolYear.L2]: ConfigEntriesChannels.ClassCalendarL2,
  [SchoolYear.L3]: ConfigEntriesChannels.ClassCalendarL3,
} as const;

async function updateMessage(
  message: GuildMessage,
  channel: GuildTextBasedChannel,
  content: Omit<MessageOptions, 'flags'>,
): Promise<void> {
  const sendMessage = async (chan: GuildTextBasedChannel): Promise<void> => void await chan.send(content)
    .then(async msg => msg.crosspostable && await msg.crosspost());
  if (!message) {
    await sendMessage(channel);
    return;
  }

  let edited = false;
  if (message.editable) {
    try {
      await promiseTimeout(
        new Promise((resolve) => {
          void message.edit(content)
            .then(() => { resolve(true); });
        }),
        5000,
      );
      edited = true;
    } catch { /* No-op */ }
  }

  if (!edited) {
    if (message.deletable)
      await message.delete();
    await sendMessage(message.channel);
  }
}

function getCalendarClassContentForSubject(
  allClasses: EclassPopulatedDocument[],
  subject: SubjectDocument,
  dropOffset = 0,
): string {
  let content = pupa(messages.classesCalendar.textChannel, subject);
  if (subject.textDocsChannel)
    content += pupa(messages.classesCalendar.textDocsChannel, subject);
  if (subject.voiceChannel)
    content += pupa(messages.classesCalendar.voiceChannel, subject);

  const exams = subject.exams.map(exam => `${exam.name} ${time(Math.floor(exam.date / 1000), TimestampStyles.RelativeTime)}`).join(' • ');
  if (exams.length > 0)
    content += `\n${exams}`;

  const formatter = (eclass: EclassPopulatedDocument): string => oneLine`
    ${pupa(messages.classesCalendar.classLine, {
      ...eclass.toJSON(),
      ...eclass.normalizeDates(),
      beginHour: dayjs(eclass.date).format('HH[h]mm'),
      endHour: dayjs(eclass.end).format('HH[h]mm'),
      messageLink: eclass.getMessageLink(),
    })}
    ${eclass.recordLink ? pupa(messages.classesCalendar.recordLink, eclass) : ''}
  `;

  const finishedClasses = drop(
    allClasses.filter(eclass => [EclassStatus.Canceled, EclassStatus.Finished].includes(eclass.status)),
    dropOffset,
  );
  const plannedClasses = allClasses
    .filter(eclass => [EclassStatus.Planned, EclassStatus.InProgress].includes(eclass.status));

  if (finishedClasses.length > 0) {
    content += '\n\n';
    content += pupa(messages.classesCalendar.finishedClasses, {
      finishedClasses: finishedClasses.map(formatter).join('\n'),
    });
  }

  if (plannedClasses.length > 0) {
    content += '\n\n';
    content += pupa(messages.classesCalendar.plannedClasses, {
      plannedClasses: plannedClasses.map(formatter).join('\n'),
    });
  }

  return content;
}

function generateCalendarEmbeds(allClasses: EclassPopulatedDocument[], subjects: SubjectDocument[]): MessageEmbed[] {
  const embeds: MessageEmbed[] = [];

  for (const subject of take(subjects, 25)) {
    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .setTitle(subject.name)
      .setThumbnail(subject.emojiImage);

    const subjectUpcomingClasses = allClasses.filter(eclass => eclass.subject.classCode === subject.classCode);
    let content: string;
    let dropOffset = 0;
    do
      content = getCalendarClassContentForSubject(subjectUpcomingClasses, subject, dropOffset++);
     while (content.length > EmbedLimits.MaximumTotalCharacters - 50);

    embed.setDescription(content);

    embeds.push(embed);
  }

  if (embeds.length === 0)
    embeds.push(new MessageEmbed().setTitle(messages.classesCalendar.noSubjects));

  return embeds;
}

function generateUpcomingClassesMessage(upcomingClasses: EclassDocument[]): string {
  // Sort the upcoming classes by date.
  upcomingClasses.sort((a, b) => a.date - b.date);
  // Group together classes that are the same day
  const classGroupsObj = groupBy(upcomingClasses, val => new Date(val.date).getDate());
  const classGroups = Object.values(classGroupsObj);
  // Sort the groups we get by date, because we don't necessarily want Monday to be the first day displayed
  classGroups.sort((grpA, grpB) => grpA[0].date - grpB[0].date);

  let builder = messages.upcomingClasses.header;

  if (classGroups.length > 0) {
    for (const classGroup of classGroups) {
      const begin = dayjs(classGroup[0].date);
      const today = begin.isToday() ? messages.upcomingClasses.today : '';
      builder += `**${capitalize(begin.format('dddd DD/MM'))}**${today}\n`;

      for (const eclass of classGroup) {
        const beginHour = dayjs(eclass.date).format('HH[h]mm');
        const endHour = dayjs(eclass.end).format('HH[h]mm');
        builder += pupa(messages.upcomingClasses.classLine, { beginHour, endHour, eclass });
      }
      builder += '\n';
    }
  } else {
    builder += messages.upcomingClasses.noClasses;
  }

  return builder;
}

async function updateClassesCalendarForSchoolYear(
  channel: GuildTextBasedChannel,
  upcomingClasses: EclassPopulatedDocument[],
  schoolYear: SchoolYear,
): Promise<void> {
  const allMessages = await channel.messages.fetch().catch(nullop);
  const allBotMessages = [
    ...(allMessages?.filter(msg => msg.author.id === container.client.id).values() ?? []),
  ].reverse();
  const firstMessage = allBotMessages.shift() as GuildMessage;

  const subjects = await Subject.find({ schoolYear });
  const yearClasses = upcomingClasses.filter(eclass => eclass.subject.schoolYear === schoolYear);

  // TODO: Check that limits are not crossed
  //     - max 6000 chars in all embed
  //     - less than 25 fields
  //     - field name max 256 chars
  //     - field value max 1024 chars
  const embeds = generateCalendarEmbeds(yearClasses, subjects);
  await updateMessage(firstMessage, channel, { embeds: take(embeds, MessageLimits.MaximumEmbeds) });

  for (const msg of allBotMessages)
    await msg.delete();
}

async function updateUpcomingClasses(
  channel: GuildTextBasedChannel,
  upcomingClasses: EclassPopulatedDocument[],
): Promise<void> {
  const content = generateUpcomingClassesMessage(upcomingClasses);
  const chunks = splitText(content);

  const allMessages = await channel.messages.fetch().catch(nullop);
  const allBotMessages = [
    ...(allMessages?.filter(msg => msg.author.id === container.client.id).values() ?? []),
  ].reverse();

  let i = 0;
  for (const chunk of chunks) {
    await updateMessage(allBotMessages[i] as GuildMessage, channel, { content: chunk });
    i++;
  }

  if (i < allBotMessages.length)
    allBotMessages.slice(i).map(async msg => await msg.delete());
}

export async function updateClassesCalendarForGuildAndSchoolYear(
  guildId: string,
  schoolYear: SchoolYear,
): Promise<void> {
  const channel = await container.client.configManager.get(calendarMapping[schoolYear], guildId);
  if (!channel) {
    container.logger.warn(`[Calendar] Needing to update calendar but no calendar channel was found for school year ${schoolYear} in guild ${guildId}. Setup an calendar channel with "${settings.prefix}setup calendar-${schoolYear}"`);
    return;
  }

  const upcomingClasses: EclassPopulatedDocument[] = await Eclass.find({
    date: { $gte: dayjs().subtract(2, 'month').startOf('day').unix() * 1000 },
    guild: guildId,
  });

  await updateClassesCalendarForSchoolYear(channel, upcomingClasses, schoolYear);
}

export async function updateUpcomingClassesForGuild(
  guildId: string,
  allUpcomingClasses?: EclassPopulatedDocument[],
): Promise<void> {
  const channel = await container.client.configManager.get(ConfigEntriesChannels.WeekUpcomingClasses, guildId);
  if (!channel) {
    container.logger.warn(`[Upcoming Classes] Needing to update week's upcoming classes but no announcement channel was found for guild ${guildId}. Setup an announcement channel with "${settings.prefix}setup week-class"`);
    return;
  }

  let upcomingClasses: EclassPopulatedDocument[] = [];
  if (isNullish(allUpcomingClasses)) {
    upcomingClasses = await Eclass.find({
      $and: [
        { date: { $lte: dayjs().add(1, 'week').unix() * 1000 } },
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
        { guild: guildId },
      ],
    });
  } else {
    upcomingClasses = allUpcomingClasses.filter(eclass => eclass.guild === guildId);
  }

  await updateUpcomingClasses(channel, upcomingClasses);
}
