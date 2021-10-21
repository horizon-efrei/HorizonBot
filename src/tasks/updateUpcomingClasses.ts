import { ApplyOptions } from '@sapphire/decorators';
import dayjs from 'dayjs';
import * as EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Eclass from '@/models/eclass';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { EclassStatus } from '@/types/database';

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateUpcomingClassesTask extends Task {
  public async run(): Promise<void> {
    const allUpcomingClasses = await Eclass.find({
      $and: [
        { date: { $lte: dayjs().add(1, 'week').unix() * 1000 } },
        { date: { $gte: Date.now() } },
        { status: EclassStatus.Planned },
      ],
    });

    for (const guildId of this.container.client.guilds.cache.keys()) {
      await EclassMessagesManager.updateUpcomingClassesForGuild(guildId, allUpcomingClasses);
      this.container.logger.debug(`[Upcoming Classes] Updated classes in guild ${guildId}.`);
    }
  }
}
