import { model, Schema } from 'mongoose';
import type { AnnouncementMessageDocument, AnnouncementMessageModel } from '@/types/database';

const AnnouncementMessageSchema = new Schema<AnnouncementMessageDocument, AnnouncementMessageModel, null>({
  announcementChannelId: {
    type: String,
    required: true,
  },
  announcementMessageId: {
    type: String,
    required: true,
  },
  preAnnouncementChannelId: {
    type: String,
    required: true,
  },
  preAnnouncementThreadId: {
    type: String,
    required: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const AnnouncementMessage = model<AnnouncementMessageDocument, AnnouncementMessageModel>('AnnouncementMessage', AnnouncementMessageSchema);
