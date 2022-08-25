import { container } from '@sapphire/framework';
import { model, Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import type { ReminderDocument, ReminderModel } from '@/types/database';

const ReminderSchema = new Schema<ReminderDocument, ReminderModel>({
  reminderId: {
    type: String,
    default: (): string => nanoid(6),
    index: true,
    unique: true,
  },
  date: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

ReminderSchema.post('save', async () => {
  await container.client.loadReminders();
});
ReminderSchema.post('remove', async () => {
  await container.client.loadReminders();
});

ReminderSchema.methods.normalizeDates = function (this: ReminderDocument): { date: number } {
  const { date } = this.toObject();

  return {
    date: Math.floor(date / 1000),
  };
};

export default model<ReminderDocument, ReminderModel>('Reminders', ReminderSchema);
