import { ApplyOptions } from '@sapphire/decorators';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import pupa from 'pupa';
import { messages } from '@/config/messages';
import { Reminder } from '@/models/reminders';
import { Task } from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';

@ApplyOptions<TaskOptions>({ cron: '* * * * *' })
export class ReminderTask extends Task {
  public async run(): Promise<void> {
    // Remove all reminders if they have been reminded more than a week ago
    const remindersToRemove = await Reminder.find({
      reminded: true,
      date: { $lte: Date.now() - 7 * 24 * 60 * 60 * 1000 },
    });

    if (remindersToRemove.length > 0)
      await Reminder.deleteMany({ _id: { $in: remindersToRemove.map(r => r._id) } });
    for (const reminder of remindersToRemove)
      this.container.client.reminders.delete(reminder.reminderId);

    // Find all reminders that are due and have not been reminded yet
    const reminders = await Reminder.find({ date: { $lte: Date.now() }, reminded: false });

    for (const reminder of reminders) {
      const user = await this.container.client.users.fetch(reminder.userId);
      const message = await user.send({
        content: pupa(messages.reminders.alarm, reminder.toJSON()),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('snooze-10min')
              .setLabel('Rappeler dans 10min')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('snooze-30min')
              .setLabel('30min')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('snooze-1h')
              .setLabel('1 heure')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('snooze-1d')
              .setLabel('1 jour')
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      });

      reminder.messageId = message.id;
      reminder.reminded = true;
      await reminder.save();

      this.container.client.reminders.set(reminder.reminderId, reminder);
    }
  }
}
