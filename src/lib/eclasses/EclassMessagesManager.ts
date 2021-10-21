import { container } from '@sapphire/pieces';
import { isNullish } from '@sapphire/utilities';
import dayjs from 'dayjs';
import type { Message, MessageOptions } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import { SchoolYear } from '@/types';
import type { GuildTextBasedChannel } from '@/types';
import type { EclassDocument, EclassPopulatedDocument } from '@/types/database';
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import {
  capitalize,
  nullop,
  promiseTimeout,
  splitText,
} from '@/utils';

const calendarMapping = new Map([
  [SchoolYear.L1, ConfigEntriesChannels.ClassCalendarL1],
  [SchoolYear.L2, ConfigEntriesChannels.ClassCalendarL2],
  [SchoolYear.L3, ConfigEntriesChannels.ClassCalendarL3],
]);

async function updateMessage(message: Message, content: MessageOptions): Promise<void> {
  let edited = false;
  if (message?.editable) {
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
    if (message?.deletable)
      await message.delete();
    await message.channel.send(content).then(async msg => msg.crosspostable && await msg.crosspost());
  }
}

function generateCalendarEmbed(upcomingClasses: EclassPopulatedDocument[]): MessageEmbed {
  const embed = new MessageEmbed()
    .setColor(settings.colors.default)
    .setTitle(messages.classesCalendar.title);

  if (upcomingClasses.length === 0) {
    embed.setDescription(messages.classesCalendar.noClasses);
    return embed;
  }

  const groupedClasses = groupBy(upcomingClasses, val => val.subject.classCode);
  for (const classes of Object.values(groupedClasses)) {
    const { subject } = classes[0];

    let content = pupa(messages.classesCalendar.textChannel, subject);
    if (subject.textDocsChannel)
      content += pupa(messages.classesCalendar.textDocsChannel, subject);
    if (subject.voiceChannel)
      content += pupa(messages.classesCalendar.voiceChannel, subject);

    const exams = subject.exams.map(exam => `${exam.name} <t:${Math.floor(exam.date / 1000)}:R>`).join(' • ');
    content += pupa(messages.classesCalendar.body, {
      exams: exams.length > 0 ? `\n${exams}` : '',
      classes: classes.map(eclass =>
        pupa(messages.classesCalendar.classLine, {
          ...eclass.toJSON(),
          date: Math.floor(eclass.date / 1000),
          beginHour: dayjs(eclass.date).format('HH[h]mm'),
          endHour: dayjs(eclass.end).format('HH[h]mm'),
        })).join('\n'),
    });

    embed.addField(pupa(messages.classesCalendar.subjectTitle, subject), content);
  }

  return embed;
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

async function updateClassesCalendar(
  channel: GuildTextBasedChannel,
  upcomingClasses: EclassPopulatedDocument[],
): Promise<void> {
  const allMessages = await channel.messages.fetch().catch(nullop);
  const allBotMessages = [
    ...(allMessages?.filter(msg => msg.author.id === container.client.id).values() ?? []),
  ].reverse();
  const firstMessage = allBotMessages.shift();

  // TODO: Check that limits are not crossed
  //     - max 6000 chars in all embed
  //     - less than 25 fields
  //     - field name max 256 chars
  //     - field value max 1024 chars
  const embed = generateCalendarEmbed(upcomingClasses);
  await updateMessage(firstMessage, { embeds: [embed] });

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
    await updateMessage(allBotMessages[i], { content: chunk });
    i++;
  }

  if (i < allBotMessages.length)
    allBotMessages.slice(i).map(async msg => await msg.delete());
}

export async function updateClassesCalendarForGuildAndSchoolYear(
  guildId: string,
  schoolYear: SchoolYear,
  allUpcomingClasses?: EclassPopulatedDocument[],
): Promise<void> {
  const channel = await container.client.configManager.get(calendarMapping.get(schoolYear), guildId);
  if (!channel) {
    container.logger.warn(`[Calendar] Needing to update calendar but no calendar channel was found for school year ${schoolYear} in guild ${guildId}. Setup an calendar channel with "${settings.prefix}setup calendar-${schoolYear}"`);
    return;
  }

  let upcomingClasses: EclassPopulatedDocument[] = [];
  if (isNullish(allUpcomingClasses)) {
    upcomingClasses = await Eclass.find({
      $and: [
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
        { guild: guildId },
      ],
    });
  } else {
    upcomingClasses = allUpcomingClasses.filter(eclass => eclass.guild === guildId);
  }

  await updateClassesCalendar(channel, upcomingClasses.filter(eclass => eclass.subject.schoolYear === schoolYear));
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
