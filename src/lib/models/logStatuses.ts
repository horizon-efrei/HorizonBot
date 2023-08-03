import { model, Schema } from 'mongoose';
import type { LogStatusesDocument, LogStatusesModel } from '@/types/database';
import { DiscordLogType, LogStatuses as LogStatusesEnum } from '@/types/database';

const LogStatusesSchema = new Schema<LogStatusesDocument, LogStatusesModel, null>({
  type: {
    type: String,
    enum: DiscordLogType,
    required: true,
  },
  status: {
    type: Number,
    enum: Object.values(LogStatusesEnum).filter(Number.isInteger),
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const LogStatuses = model<LogStatusesDocument, LogStatusesModel>('LogStatuses', LogStatusesSchema);
