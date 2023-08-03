import { container } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import { model, Schema } from 'mongoose';
import autopopulate from 'mongoose-autopopulate';
import { customAlphabet, urlAlphabet } from 'nanoid';
import slug from 'slug';
import { eclass as eclassConfig } from '@/config/commands/professors';
import type { EclassDocument, EclassModel } from '@/types/database';
import {
  ConfigEntriesChannels,
  EclassPlace,
  EclassStatus,
  EclassStep,
} from '@/types/database';
import { makeMessageLink } from '@/utils';

const nanoid = customAlphabet(urlAlphabet.replace(/[_-]/, ''), 4);

const EclassSchema = new Schema<EclassDocument, EclassModel>({
  classId: {
    type: String,
    required: true,
    index: true,
  },
  guildId: {
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
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  end: {
    type: Date,
    default(this: EclassDocument): Date { return new Date(this.date.getTime() + this.duration); },
  },
  professorId: {
    type: String,
    required: true,
  },
  classRoleId: {
    type: String,
    required: true,
    index: true,
  },
  targetRoleId: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    enum: EclassPlace,
    required: true,
  },
  placeInformation: {
    type: String,
    required: false,
  },
  announcementChannelId: {
    type: String,
    required: true,
    enum: ConfigEntriesChannels,
  },
  announcementMessageId: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: EclassStatus.Planned,
    enum: EclassStatus,
  },
  step: {
    type: String,
    default: EclassStep.None,
    enum: EclassStep,
  },
  subscriberIds: [String],
  isRecorded: {
    type: Boolean,
    default: false,
  },
  recordLinks: [String],
}, { timestamps: true });

EclassSchema.statics.generateId = (professor: GuildMember, date: Date): string => [
  slug(professor.displayName.replace(/\s+/, ''), '_'),
  dayjs(date).format('HHmmDDMMYYYY'),
  nanoid(),
].join('_');

EclassSchema.methods.getMessageLink = function (this: EclassDocument): string {
  const announcementChannel = container.client.configManager.getFromCache(this.announcementChannelId, this.guildId);
  if (!announcementChannel)
    throw new Error(`Could not find [eclass:${this.classId} announcement's channel (${this.announcementChannelId}).`);
  return makeMessageLink(this.guildId, announcementChannel.id, this.announcementMessageId);
};

EclassSchema.methods.normalizeDates = function (
  this: EclassDocument,
  formatDuration?: boolean,
): { date: number; end: number; duration: number | string } {
  const { date, end, duration }: { date: Date; end: Date; duration: number } = this.toObject();

  return {
    date: Math.floor(date.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
    duration: formatDuration ? dayjs.duration(duration).humanize() : Math.floor(duration / 1000),
  };
};

EclassSchema.methods.getStatus = function (this: EclassDocument): string {
  return eclassConfig.messages.statuses[this.status];
};

EclassSchema.plugin(autopopulate);

export const Eclass = model<EclassDocument, EclassModel>('Eclass', EclassSchema);
