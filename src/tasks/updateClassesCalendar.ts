import { ApplyOptions } from '@sapphire/decorators';
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
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import { nullop, promiseTimeout } from '@/utils';

const calendarMapping = new Map([
  [SchoolYear.L1, ConfigEntriesChannels.ClassCalendarL1],
  [SchoolYear.L2, ConfigEntriesChannels.ClassCalendarL2],
  [SchoolYear.L3, ConfigEntriesChannels.ClassCalendarL3],
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
        const channel = await this.container.client.configManager.get(calendarMapping.get(schoolYear), guildId);
        if (!channel) {
          this.container.logger.warn(`[Calendar] Needing to update calendar but no calendar channel was found for school year ${schoolYear} in guild ${guildId}. Setup an calendar channel with "${settings.prefix}setup calendar-${schoolYear}"`);
          continue;
        }

        const upcomingClasses = allUpcomingClasses.filter(eclass => eclass.guild === guildId
          && eclass.subject.schoolYear === schoolYear);

        const allMessages = await channel.messages.fetch().catch(nullop);
        const allBotMessages = [
          ...(allMessages?.filter(msg => msg.author.id === this.container.client.id).values() ?? []),
        ].reverse();
        const firstMessage = allBotMessages.shift();

        // TODO: Check that limits are not crossed
        //     - max 6000 chars in all embed
        //     - less than 25 fields
        //     - field name max 256 chars
        //     - field value max 1024 chars
        const embed = this._generateCalendarEmbed(upcomingClasses);

        let edited = false;
        if (firstMessage?.editable) {
          try {
            await promiseTimeout(firstMessage.edit({ embeds: [embed] }), 5000);
            edited = true;
          } catch { /* No-op */ }
        }

        if (!edited) {
          if (firstMessage?.deletable)
            await firstMessage.delete();
          await channel.send({ embeds: [embed] }).then(async msg => await msg.crosspost());
        }

        for (const msg of allBotMessages)
          await msg.delete();

        this.container.logger.debug(`[Calendar] Updated classes for school year ${schoolYear} in guild ${guildId}`);
      }
    }
  }

  private _generateCalendarEmbed(upcomingClasses: EclassPopulatedDocument[]): MessageEmbed {
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
}
