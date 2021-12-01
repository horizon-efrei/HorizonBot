import { model, Schema } from 'mongoose';
import type { LogStatusesDocument, LogStatusesModel } from '@/types/database';
import { LogStatuses } from '@/types/database';

const LogStatusesSchema = new Schema<LogStatusesDocument, LogStatusesModel, null>({
  type: {
    type: Number,
    required: true,
  },
  status: {
    type: Number,
    enum: Object.values(LogStatuses).filter(Number.isInteger),
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default model<LogStatusesDocument, LogStatusesModel>('LogStatuses', LogStatusesSchema);
