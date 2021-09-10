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
  authorId: {
    type: String,
    required: true,
  },
  alertMessageId: {
    type: String,
  },
  swear: {
    type: String,
  },
  isManual: {
    type: Boolean,
    default: false,
  },
  manualModeratorId: {
    type: String,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  approvedDate: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default model<FlaggedMessageDocument, FlaggedMessageModel>('FlaggedMessage', FlaggedMessageSchema);
