import type { GuildMember, Role } from 'discord.js';
import type { Document, Model, Types } from 'mongoose';
import type { GuildTextBasedChannel, SchoolYear, TeachingUnit } from '@/types';

/* ****************************** */
/*  Configuration Database Types  */
/* ****************************** */

// #region Configuration Database Types
/** Enum for the "Configuration"'s mongoose schema */
export enum ConfigEntriesChannels {
  ClassAnnouncementGeneral = 'channel-class-announcement-general',
  ClassAnnouncementL1 = 'channel-class-announcement-l1',
  ClassAnnouncementL2 = 'channel-class-announcement-l2',
  ClassAnnouncementL3 = 'channel-class-announcement-l3',
  ClassCalendarL1 = 'channel-class-calendar-l1',
  ClassCalendarL2 = 'channel-class-calendar-l2',
  ClassCalendarL3 = 'channel-class-calendar-l3',
  ModeratorFeedback = 'channel-moderator-feedback',
  WeekUpcomingClasses = 'channel-week-upcoming-classes',
}

export enum ConfigEntriesRoles {
  EprofComputerScience = 'role-eprof-computer-science',
  EprofGeneralFormation = 'role-eprof-general-formation',
  EprofMathematics = 'role-eprof-mathematics',
  EprofPhysicsElectronics = 'role-eprof-physics-electronics',
  Eprof = 'role-eprof',
  Staff = 'role-staff',
}

export type ConfigEntries = ConfigEntriesChannels | ConfigEntriesRoles;

export type ConfigEntryHolds = GuildTextBasedChannel | Role;

/** Interface for the "Configuration"'s mongoose schema */
export interface ConfigurationBase {
  name: ConfigEntries;
  guild: string;
  value: string;
}

/** Interface for the "Configuration"'s mongoose document */
export interface ConfigurationDocument extends ConfigurationBase, Document {}

/** Interface for the "Configuration"'s mongoose model */
export type ConfigurationModel = Model<ConfigurationDocument>;
// #endregion

/* ****************************** */
/*  Eclass Database Types  */
/* ****************************** */

// #region Eclass Database Types
/** Enum for the "Eclass"'s mongoose schema */
export enum EclassStatus {
  Planned,
  InProgress,
  Finished,
  Canceled,
}

/** Interface for the "Eclass"'s mongoose schema */
export interface EclassBase {
  classId: string;
  guild: string;
  topic: string;
  subject: SubjectDocument | Types.ObjectId;
  date: number;
  duration: number;
  end: number;
  professor: string;
  classRole: string;
  targetRole: string;
  announcementChannel: ConfigEntriesChannels;
  announcementMessage: string;
  status: EclassStatus;
  reminded: boolean;
  subscribers: string[];
  isRecorded: boolean;
  recordLink: string | null;
}

export type PrettyEclass = Omit<EclassBase, 'date' | 'duration' | 'end'> & { date: string; duration: string; end: string };

/** Interface for the "Eclass"'s mongoose document */
interface EclassBaseDocument extends EclassBase, Document {
  subscribers: Types.Array<string>;
  toData(): PrettyEclass;
  getStatus(): string;
}

/** Interface for the "Eclass"'s mongoose document, when the subject field is not populated */
export interface EclassDocument extends EclassBaseDocument {
  subject: SubjectDocument['_id'];
}
/** Interface for the "Eclass"'s mongoose document, when the subject field is populated */
export interface EclassPopulatedDocument extends EclassBaseDocument {
  subject: SubjectDocument;
}

/** Interface for the "Eclass"'s mongoose model */
export interface EclassModel extends Model<EclassDocument> {
  generateId(professor: GuildMember, date: Date): string;
}
// #endregion

/* ****************************** */
/*  Subject Database Types  */
/* ****************************** */

// #region Subject Database Types

/** Interface for the "Subject"'s mongoose schema */
export interface SubjectBase {
  name: string;
  nameEnglish: string;
  slug: string;
  emoji: string;
  emojiImage: string;
  classCode: string;
  moodleLink: string;
  docsLink: string;
  teachingUnit: TeachingUnit;
  schoolYear: SchoolYear;
  textChannel: string;
  textDocsChannel?: string;
  voiceChannel?: string;
  exams: Array<{ name: string; date: number }>;
}

/** Interface for the "Subject"'s mongoose document */
export interface SubjectDocument extends SubjectBase, Document {}


/** Interface for the "Subject"'s mongoose model */
export type SubjectModel = Model<SubjectDocument>;
// #endregion

/* ***************************** */
/*  ReactionRole Database Types  */
/* ***************************** */

// #region ReactionRole Database Types
/** Interface for the "ReactionRole"'s mongoose schema */
export interface ReactionRoleBase {
  messageId: string;
  channelId: string;
  guildId: string;
  reactionRolePairs: Array<{ role: string; reaction: string }>;
}

/** Interface for the "ReactionRole"'s mongoose document */
export interface ReactionRoleDocument extends Omit<ReactionRoleBase, 'reactionRolePairs'>, Document {
  reactionRolePairs: Types.Array<{ role: string; reaction: string }>;
}

/** Interface for the "ReactionRole"'s mongoose model */
export type ReactionRoleModel = Model<ReactionRoleDocument>;
// #endregion

/* ********************************* */
/*  RoleIntersection Database Types  */
/* ********************************* */

// #region RoleIntersection Database Types
/** Interface for the "RoleIntersection"'s mongoose schema */
export interface RoleIntersectionBase {
  roleId: string;
  guildId: string;
  expiration: number;
}

/** Interface for the "RoleIntersection"'s mongoose document */
export interface RoleIntersectionDocument extends RoleIntersectionBase, Document {}

/** Interface for the "RoleIntersection"'s mongoose model */
export type RoleIntersectionModel = Model<RoleIntersectionDocument>;
// #endregion

/* ********************************* */
/*  FlaggedMessage Database Types  */
/* ********************************* */

// #region FlaggedMessage Database Types
/** Interface for the "FlaggedMessage"'s mongoose schema */
export interface FlaggedMessageBase {
  guildId: string;
  channelId: string;
  messageId: string;
  authorId: string;
  alertMessageId?: string;
  swear?: string;
  isManual?: boolean;
  manualModeratorId?: string;
  approved: boolean;
  approvedDate: number;
}

/** Interface for the "FlaggedMessage"'s mongoose document */
export interface FlaggedMessageDocument extends FlaggedMessageBase, Document {}

/** Interface for the "FlaggedMessage"'s mongoose model */
export type FlaggedMessageModel = Model<FlaggedMessageDocument>;
// #endregion

/* ******************** */
/*  Tag Database Types  */
/* ******************** */

// #region Tag Database Types
/** Interface for the "Tag"'s mongoose schema */
export interface TagBase {
  name: string;
  aliases: string[];
  content: string;
  guildId: string;
}

/** Interface for the "Tag"'s mongoose document */
export interface TagDocument extends TagBase, Document {}

/** Interface for the "Tag"'s mongoose model */
export type TagModel = Model<TagDocument>;
// #endregion
