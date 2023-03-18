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
    type: Date,
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
  reminded: {
    type: Boolean,
    default: false,
  },
  messageId: {
    type: String,
    required: false,
  },
}, { timestamps: true });

ReminderSchema.post('save', async () => {
  if (container.client)
    await container.client.loadReminders();
});
ReminderSchema.post('remove', async () => {
  if (container.client)
    await container.client.loadReminders();
});

ReminderSchema.methods.normalizeDates = function (this: ReminderDocument): { date: number } {
  const { date }: { date: Date } = this.toObject();

  return {
    date: Math.floor(date.getTime() / 1000),
  };
};

export default model<ReminderDocument, ReminderModel>('Reminders', ReminderSchema);
