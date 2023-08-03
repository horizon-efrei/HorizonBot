import { model, Schema } from 'mongoose';
import type { DiscordLogDocument, DiscordLogModel } from '@/types/database';
import { DiscordLogType } from '@/types/database';

const DiscordLogSchema = new Schema<DiscordLogDocument, DiscordLogModel, null>({
  type: {
    type: String,
    enum: DiscordLogType,
    required: true,
  },
  context: {
    type: Schema.Types.Mixed,
    required: true,
  },
  content: {
    type: Schema.Types.Mixed,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
}, { timestamps: true });

export const DiscordLog = model<DiscordLogDocument, DiscordLogModel>('DiscordLogs', DiscordLogSchema);
