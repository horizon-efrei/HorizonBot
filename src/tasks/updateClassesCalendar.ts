import { ApplyOptions } from '@sapphire/decorators';
import EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Eclass from '@/models/eclass';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { SchoolYear } from '@/types';
import { EclassStatus } from '@/types/database';

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateClassesCalendarTask extends Task {
  public async run(): Promise<void> {
    const allUpcomingClasses = await Eclass.find({
      $and: [
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
      ],
    });

    for (const guildId of this.container.client.guilds.cache.keys()) {
      for (const schoolYear of Object.values(SchoolYear)) {
        await EclassMessagesManager.updateClassesCalendarForGuildAndSchoolYear(guildId, schoolYear, allUpcomingClasses);
        this.container.logger.debug(`[Calendar] Updated classes for school year ${schoolYear} in guild ${guildId}`);
      }
    }
  }
}
