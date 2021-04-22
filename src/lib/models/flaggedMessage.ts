import { model, Schema } from 'mongoose';
import type { FlaggedMessageDocument, FlaggedMessageModel } from '@/types/database';

const FlaggedMessageSchema = new Schema<FlaggedMessageDocument, FlaggedMessageModel>({
  guildId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
  alertMessageId: {
    type: String,
    required: true,
  },
  swear: {
    type: String,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  approvedDate: {
    type: Number,
    default: 0,
  },
});

export default model<FlaggedMessageDocument, FlaggedMessageModel>('FlaggedMessage', FlaggedMessageSchema);
