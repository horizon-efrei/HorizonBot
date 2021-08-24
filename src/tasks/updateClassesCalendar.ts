import { ApplyOptions } from '@sapphire/decorators';
import { chunk as chunkify } from '@sapphire/utilities';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { SchoolYear } from '@/types';
import type { EclassPopulatedDocument } from '@/types/database';
import { ConfigEntries, EclassStatus } from '@/types/database';
import { nullop } from '@/utils';

const calendarMapping = new Map([
  [SchoolYear.L1, ConfigEntries.ClassCalendarL1],
  [SchoolYear.L2, ConfigEntries.ClassCalendarL2],
  [SchoolYear.L3, ConfigEntries.ClassCalendarL3],
]);

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateClassesCalendarTask extends Task {
  public async run(): Promise<void> {
    const allUpcomingClasses: EclassPopulatedDocument[] = await Eclass.find({
      $and: [
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
      ],
    });

    for (const guildId of this.container.client.guilds.cache.keys()) {
      for (const schoolYear of Object.values(SchoolYear)) {
        const channel = await this.container.client.configManager.get(guildId, calendarMapping.get(schoolYear));
        if (!channel) {
          this.container.logger.warn(`[Calendar] Needing to update calendar but no calendar channel was found for school year ${schoolYear} in guild ${guildId}. Setup an calendar channel with "${settings.prefix}setup calendar-${schoolYear}"`);
          continue;
        }

        const upcomingClasses = allUpcomingClasses.filter(eclass => eclass.guild === guildId
          && eclass.subject.schoolYear === schoolYear);

        const embeds = this._generateCalendarEmbeds(upcomingClasses);
        const chunks = chunkify(embeds, 10);

        const allMessages = await channel.messages.fetch().catch(nullop);
        const allBotMessages = [
          ...(allMessages?.filter(msg => msg.author.id === this.container.client.id).values() ?? []),
          ].reverse();

        let i = 0;
        for (const chunk of chunks) {
          // eslint-disable-next-line unicorn/prefer-ternary
          if (allBotMessages[i]?.editable)
            await allBotMessages[i].edit({ embeds: chunk });
          else
            await channel.send({ embeds: chunk }).then(async msg => await msg.crosspost());
          i++;
        }

        if (i < allBotMessages.length)
          allBotMessages.slice(i).map(async msg => await msg.delete());

        this.container.logger.debug(`[Calendar] Updated classes for school year ${schoolYear} in guild ${guildId}`);
      }
    }
  }

  private _generateCalendarEmbeds(upcomingClasses: EclassPopulatedDocument[]): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    const groupedClasses = groupBy(upcomingClasses, val => val.subject.classCode);
    for (const classes of Object.values(groupedClasses)) {
      const { subject } = classes[0];
      let baseInformations = pupa(messages.classesCalendar.textChannel, subject);
      if (subject.textDocsChannel)
        baseInformations += pupa(messages.classesCalendar.textDocsChannel, subject);

      embeds.push(
        new MessageEmbed()
          .setAuthor(pupa(messages.classesCalendar.pretitle, subject))
          .setURL(subject.moodleLink)
          .setTitle(pupa(messages.classesCalendar.title, subject))
          .setThumbnail(subject.emojiImage)
          .setDescription(
            pupa(messages.classesCalendar.body, {
              baseInformations,
              exams: subject.exams.map(exam => `${exam.name} <t:${Math.floor(exam.date / 1000)}:R>`).join(' • '),
              classes: classes.map(eclass =>
                pupa(messages.classesCalendar.classLine, {
                  ...eclass.toJSON(),
                  date: Math.floor(eclass.date / 1000),
                  beginHour: dayjs(eclass.date).format('HH[h]mm'),
                  endHour: dayjs(eclass.end).format('HH[h]mm'),
                })).join('\n'),
            }),
          ),
      );
    }

    return embeds;
  }
}
