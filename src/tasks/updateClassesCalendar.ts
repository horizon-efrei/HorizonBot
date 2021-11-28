import { ApplyOptions } from '@sapphire/decorators';
import * as EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { SchoolYear } from '@/types';

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateClassesCalendarTask extends Task {
  public async run(): Promise<void> {
    for (const guildId of this.container.client.guilds.cache.keys()) {
      for (const schoolYear of Object.values(SchoolYear)) {
        await EclassMessagesManager.updateClassesCalendarForGuildAndSchoolYear(guildId, schoolYear);
        this.container.logger.debug(`[Calendar] Updated classes for school year ${schoolYear} in guild ${guildId}`);
      }
    }
  }
}
