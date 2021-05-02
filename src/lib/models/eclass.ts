import { model, Schema } from 'mongoose';
import type { EclassDocument, EclassModel } from '@/types/database';
import { EclassStatus } from '@/types/database';

const EclassSchema = new Schema<EclassDocument, EclassModel>({
  textChannel: {
    type: String,
    required: true,
  },
  guild: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  date: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  professor: {
    type: String,
    required: true,
  },
  targetRole: {
    type: String,
    required: true,
  },
  announcementMessage: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: EclassStatus.Planned,
    enum: EclassStatus,
  },
});

export default model<EclassDocument, EclassModel>('Eclass', EclassSchema);
