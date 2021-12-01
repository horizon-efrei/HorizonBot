import { model, Schema } from 'mongoose';
import type { FlaggedMessageDocument, FlaggedMessageModel } from '@/types/database';

const FlaggedMessageSchema = new Schema<FlaggedMessageDocument, FlaggedMessageModel, null>({
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
  moderatorId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default model<FlaggedMessageDocument, FlaggedMessageModel>('FlaggedMessage', FlaggedMessageSchema);
