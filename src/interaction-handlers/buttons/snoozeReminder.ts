import { ApplyOptions } from '@sapphire/decorators';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import pupa from 'pupa';
import { messages } from '@/config/messages';
import { Reminder } from '@/models/reminders';
import type { ReminderDocument } from '@/types/database';

const validButtonIds = new Set(['snooze-10min', 'snooze-30min', 'snooze-1h', 'snooze-1d']);

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class SnoozeReminderButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction): Option<never> {
    if (!validButtonIds.has(interaction.customId))
      return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction): Promise<void> {
    const reminder = this.container.client.reminders
      .values()
      .find(rem => rem.messageId === interaction.message.id);

    if (!reminder) {
      await interaction.reply({ content: messages.reminders.noLongerValid, ephemeral: true });
      return;
    }

    let offset = 0;
    let duration = '';
    switch (interaction.customId) {
      case 'snooze-10min':
        offset = 10 * 60 * 1000;
        duration = '10 minutes';
        break;
      case 'snooze-30min':
        offset = 30 * 60 * 1000;
        duration = '30 minutes';
        break;
      case 'snooze-1h':
        offset = 60 * 60 * 1000;
        duration = '1 heure';
        break;
      case 'snooze-1d':
        offset = 24 * 60 * 60 * 1000;
        duration = '1 jour';
        break;
    }

    const newReminder = await Reminder.findByIdAndUpdate<ReminderDocument>(
      reminder._id,
      { $set: { date: Date.now() + offset, reminded: false } },
      { new: true },
    );

    this.container.client.reminders.set(reminder.reminderId, newReminder!);

    await interaction.reply(
      pupa(messages.reminders.snoozed, {
        duration,
        reminder: { ...newReminder!.toJSON(), ...newReminder!.normalizeDates() },
      }),
    );
  }
}
