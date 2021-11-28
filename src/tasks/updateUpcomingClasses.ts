import { ApplyOptions } from '@sapphire/decorators';
import * as EclassMessagesManager from '@/eclasses/EclassMessagesManager';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateUpcomingClassesTask extends Task {
  public async run(): Promise<void> {
    for (const guildId of this.container.client.guilds.cache.keys()) {
      await EclassMessagesManager.updateUpcomingClassesForGuild(guildId);
      this.container.logger.debug(`[Upcoming Classes] Updated classes in guild ${guildId}.`);
    }
  }
}
