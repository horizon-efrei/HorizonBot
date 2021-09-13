import { model, Schema } from 'mongoose';
import type { DiscordLogDocument, DiscordLogModel } from '@/types/database';

const DiscordLogSchema = new Schema<DiscordLogDocument, DiscordLogModel>({
  type: {
    type: Number,
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

export default model<DiscordLogDocument, DiscordLogModel>('DiscordLogs', DiscordLogSchema);
