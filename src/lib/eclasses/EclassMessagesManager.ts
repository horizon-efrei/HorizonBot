import { container } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import dayjs from 'dayjs';
import type { BaseMessageOptions, GuildTextBasedChannel, TextBasedChannel } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import messages from '@/config/messages';
import Eclass from '@/models/eclass';
import type { GuildMessage } from '@/types';
import type { EclassDocument, EclassPopulatedDocument } from '@/types/database';
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import {
  capitalize,
  nullop,
  promiseTimeout,
  splitText,
} from '@/utils';

async function updateMessage(
  message: GuildMessage,
  channel: GuildTextBasedChannel,
  content: Omit<BaseMessageOptions, 'flags'>,
): Promise<void> {
  const sendMessage = async (chan: TextBasedChannel): Promise<void> => void await chan.send(content)
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

function generateUpcomingClassesMessage(upcomingClasses: EclassDocument[]): string {
  // Sort the upcoming classes by date.
  upcomingClasses.sort((a, b) => a.date.getTime() - b.date.getTime());
  // Group together classes that are the same day
  const classGroupsObj = groupBy(upcomingClasses, val => val.date);
  const classGroups = Object.values(classGroupsObj);
  // Sort the groups we get by date, because we don't necessarily want Monday to be the first day displayed
  classGroups.sort((grpA, grpB) => grpA[0].date.getTime() - grpB[0].date.getTime());

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

export async function updateUpcomingClassesForGuild(
  guildId: string,
  allUpcomingClasses?: EclassPopulatedDocument[],
): Promise<void> {
  const channel = await container.client.configManager.get(ConfigEntriesChannels.WeekUpcomingClasses, guildId);
  if (!channel) {
    container.logger.warn(`[Upcoming Classes] Needing to update week's upcoming classes but no announcement channel was found for guild ${guildId}. Set up an announcement channel with "/setup set-channel name:${ConfigEntriesChannels.WeekUpcomingClasses} channel:<channel>"`);
    return;
  }

  let upcomingClasses: EclassPopulatedDocument[];
  if (isNullish(allUpcomingClasses)) {
    upcomingClasses = await Eclass.find({
      $and: [
        { date: { $lte: dayjs().add(1, 'week').unix() * 1000 } },
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
        { guildId },
      ],
    });
  } else {
    upcomingClasses = allUpcomingClasses.filter(eclass => eclass.guildId === guildId);
  }

  await updateUpcomingClasses(channel, upcomingClasses);
}
