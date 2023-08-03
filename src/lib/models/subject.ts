import { model, Schema } from 'mongoose';
import { SchoolYear, TeachingUnit } from '@/types';
import type { SubjectDocument, SubjectModel } from '@/types/database';

const SubjectSchema = new Schema<SubjectDocument, SubjectModel, null>({
  name: {
    type: String,
    required: true,
  },
  nameEnglish: {
    type: String,
    required: false,
  },
  emoji: {
    type: String,
    required: true,
  },
  emojiImage: {
    type: String,
    required: false,
  },
  classCode: {
    type: String,
    required: true,
    index: true,
  },
  moodleLink: {
    type: String,
    required: true,
  },
  docsLink: {
    type: String,
    required: false,
  },
  teachingUnit: {
    type: String,
    enum: TeachingUnit,
    required: true,
  },
  schoolYear: {
    type: String,
    enum: SchoolYear,
    required: true,
  },
  textChannelId: {
    type: String,
    required: true,
  },
  textDocsChannelId: {
    type: String,
  },
  voiceChannelId: {
    type: String,
  },
}, { timestamps: true });

export const Subject = model<SubjectDocument, SubjectModel>('Subject', SubjectSchema);
