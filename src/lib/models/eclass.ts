import { container } from '@sapphire/pieces';
import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import { model, Schema } from 'mongoose';
import autopopulate from 'mongoose-autopopulate';
import { customAlphabet, urlAlphabet } from 'nanoid';
import slug from 'slug';
import { eclass as eclassConfig } from '@/config/commands/professors';
import settings from '@/config/settings';
import type { EclassDocument, EclassModel } from '@/types/database';
import { ConfigEntriesChannels, EclassStatus } from '@/types/database';
import { makeMessageLink } from '@/utils';

const nanoid = customAlphabet(urlAlphabet.replace(/[_-]/, ''), 4);

const EclassSchema = new Schema<EclassDocument, EclassModel>({
  classId: {
    type: String,
    required: true,
    index: true,
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
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    autopopulate: true,
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
    enum: ConfigEntriesChannels,
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
  recordLink: {
    type: String,
    default: null,
  },
}, { timestamps: true });


EclassSchema.statics.generateId = (professor: GuildMember, date: Date): string => [
  slug(professor.displayName.replace(/\s+/, ''), '_'),
  dayjs(date).format('HHmmDDMMYYYY'),
  nanoid(),
].join('_');

EclassSchema.methods.getMessageLink = function (): string {
  const announcementChannel = container.client.configManager.getFromCache(this.announcementChannel, this.guild);
  return makeMessageLink(this.guild, announcementChannel.id, this.announcementMessage);
};

EclassSchema.methods.formatDates = function (): { date: string; end: string; duration: string } {
  const { date, end, duration } = this.toObject();

  return {
    date: dayjs(date).format(settings.configuration.dateFormat),
    end: dayjs(end).format(settings.configuration.dateFormat),
    duration: dayjs.duration(duration).humanize(),
  };
};

EclassSchema.methods.normalizeDates = function (
  this: EclassDocument,
  formatDuration?: boolean,
): { date: number; end: number; duration: number | string } {
  const { date, end, duration } = this.toObject();

  return {
    date: Math.floor(date / 1000),
    end: Math.floor(end / 1000),
    duration: formatDuration ? dayjs.duration(duration).humanize() : Math.floor(duration / 1000),
  };
};

EclassSchema.methods.getStatus = function (): string {
  return eclassConfig.messages.statuses[this.status];
};

EclassSchema.plugin(autopopulate);

export default model<EclassDocument, EclassModel>('Eclass', EclassSchema);
