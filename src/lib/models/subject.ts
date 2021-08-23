import { model, Schema } from 'mongoose';
import { SchoolYear } from '../types';
import type { SubjectDocument, SubjectModel } from '@/types/database';

const SubjectSchema = new Schema<SubjectDocument, SubjectModel>({
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
    required: true,
  },
  schoolYear: {
    type: String,
    enum: SchoolYear,
    required: true,
  },
  textChannel: {
    type: String,
    required: true,
  },
  textDocsChannel: {
    type: String,
  },
  voiceChannel: {
    type: String,
  },
  examDates: {
    ce: { type: String },
    de: { type: String },
  },
}, { timestamps: true });

export default model<SubjectDocument, SubjectModel>('Subject', SubjectSchema);
