import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import { model, Schema } from 'mongoose';
import slug from 'slug';
import settings from '@/config/settings';
import type { EclassDocument, EclassModel, PrettyEclass } from '@/types/database';
import { ConfigEntries, EclassStatus } from '@/types/database';

const EclassSchema = new Schema<EclassDocument, EclassModel>({
  classId: {
    type: String,
    required: true,
    index: true,
  },
  classChannel: {
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
  subject: {
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
  end: {
    type: Number,
    default(this: EclassDocument): number { return this.date + this.duration; },
  },
  professor: {
    type: String,
    required: true,
  },
  classRole: {
    type: String,
    required: true,
    index: true,
  },
  targetRole: {
    type: String,
    required: true,
  },
  announcementChannel: {
    type: String,
    required: true,
    enum: ConfigEntries,
  },
  announcementMessage: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: EclassStatus.Planned,
    enum: EclassStatus,
  },
  reminded: {
    type: Boolean,
    default: false,
  },
  subscribers: [String],
  isRecorded: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const pad = (n: number): string => n.toString().padStart(2, '0');

EclassSchema.statics.generateId = function (topic: string, professor: GuildMember, date: Date): string {
  return slug([
    slug(topic, ''),
    slug(professor.displayName),
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
    `${pad(date.getDate())}${pad(date.getMonth() + 1)}`,
    date.getFullYear(),
  ].join('_'), '_');
};

EclassSchema.methods.toData = function (): PrettyEclass {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { _id, __v, ...doc } = this.toObject();

  return {
    ...doc,
    date: dayjs(doc.date).format(settings.configuration.dateFormat),
    end: dayjs(doc.end).format(settings.configuration.dateFormat),
    duration: dayjs.duration(doc.duration).humanize(),
  };
};

export default model<EclassDocument, EclassModel>('Eclass', EclassSchema);