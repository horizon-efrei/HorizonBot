import { ApplyOptions } from '@sapphire/decorators';
import pupa from 'pupa';
import messages from '@/config/messages';
import Reminders from '@/models/reminders';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';
import { noop } from '@/utils';

@ApplyOptions<TaskOptions>({ cron: '* * * * *' })
export default class ReminderTask extends Task {
  public async run(): Promise<void> {
    const reminders = Reminders.find({ date: { $lte: Date.now() } });

    for await (const reminder of reminders) {
      const member = await this.container.client.guilds.cache.get(reminder.guildId).members.fetch(reminder.userId);
      await member.send(pupa(messages.reminders.alarm, reminder.toJSON())).catch(noop);
      await reminder.remove();
    }
  }
}
