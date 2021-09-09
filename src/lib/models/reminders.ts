import { container } from '@sapphire/pieces';
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
  guildId: {
    type: String,
    required: true,
  },
});

ReminderSchema.post('save', async () => {
  await container.client.loadReminders();
});
ReminderSchema.post('remove', async () => {
  await container.client.loadReminders();
});

export default model<ReminderDocument, ReminderModel>('Reminders', ReminderSchema);
