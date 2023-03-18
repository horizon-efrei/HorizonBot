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
      const user = await this.container.client.users.fetch(reminder.userId);
      await user.send(pupa(messages.reminders.alarm, reminder.toJSON())).catch(noop);
      await reminder.deleteOne();
      this.container.client.reminders = new Set(
        this.container.client.reminders.filter(r => r.reminderId !== reminder.reminderId),
      );
    }
  }
}
