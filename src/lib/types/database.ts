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
  Logs = 'channel-logs',
  ModeratorFeedback = 'channel-moderator-feedback',
  WeekUpcomingClasses = 'channel-week-upcoming-classes',
}

export enum ConfigEntriesRoles {
  Eprof = 'role-eprof',
  EprofComputerScience = 'role-eprof-computer-science',
  EprofGeneralFormation = 'role-eprof-general-formation',
  EprofMathematics = 'role-eprof-mathematics',
  EprofPhysicsElectronics = 'role-eprof-physics-electronics',
  SchoolYearL1 = 'role-l1',
  SchoolYearL2 = 'role-l2',
  SchoolYearL3 = 'role-l3',
  SchoolYearL3Abroad = 'role-l3-abroad',
  SchoolYearL3HalfCampus = 'role-l3-half-campus',
  SchoolYearL3FullCampus = 'role-l3-full-campus',
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
/** Enum for the eclass's current status */
export enum EclassStatus {
  Planned,
  InProgress,
  Finished,
  Canceled,
}

/** Enum for the eclass's place */
export enum EclassPlace {
  Discord = 'discord',
  Teams = 'teams',
  OnSite = 'on-site',
  Other = 'other',
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
  place: EclassPlace;
  placeInformation: string | null;
  announcementChannel: ConfigEntriesChannels;
  announcementMessage: string;
  status: EclassStatus;
  reminded: boolean;
  subscribers: string[];
  isRecorded: boolean;
  recordLink: string | null;
}

/** Interface for the "Eclass"'s mongoose document */
interface EclassBaseDocument extends EclassBase, Document {
  subscribers: Types.Array<string>;
  getMessageLink(): string;
  formatDates(): { date: string; end: string; duration: string };
  getStatus(): string;
  normalizeDates(formatDuration: true): { date: number; end: number; duration: string };
  normalizeDates(formatDuration?: false): { date: number; end: number; duration: number };
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
  uniqueRole: boolean;
  roleCondition: string | null;
}

/** Interface for the "ReactionRole"'s mongoose document */
export interface ReactionRoleDocument extends Omit<ReactionRoleBase, 'reactionRolePairs'>, Document {
  reactionRolePairs: Types.Array<{ role: string; reaction: string }>;
  getMessageLink(): string;
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
  moderatorId: string;
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
  uses: number;
  isEmbed: boolean;
  guildId: string;
}

/** Interface for the "Tag"'s mongoose document */
export interface TagDocument extends TagBase, Document {}

/** Interface for the "Tag"'s mongoose model */
export type TagModel = Model<TagDocument>;
// #endregion

/* ************************* */
/*  Reminder Database Types  */
/* ************************* */

// #region Reminder Database Types
/** Interface for the "Reminder"'s mongoose schema */
export interface ReminderBase {
  reminderId: string;
  date: number;
  description: string;
  userId: string;
}

/** Interface for the "Reminder"'s mongoose document */
export interface ReminderDocument extends ReminderBase, Document {
  normalizeDates(): { date: number };
}

/** Interface for the "Reminder"'s mongoose model */
export type ReminderModel = Model<ReminderDocument>;
// #endregion

/* ***************************** */
/*  Discord Logs Database Types  */
/* ***************************** */

// #region Discord Logs Database Types
/** Enum for the "Discord Logs"'-type mongoose schema */
export enum DiscordLogType {
  ChangeNickname,
  ChangeUsername,
  GuildJoin,
  GuildLeave,
  InvitePost,
  MessageEdit,
  MessagePost,
  MessageRemove,
  ReactionAdd,
  ReactionRemove,
  RoleAdd,
  RoleRemove,
  VoiceJoin,
  VoiceLeave,
  VoiceMove,
}

export interface GuildLeaveUserSnapshot {
  userId: string;
  username: string;
  displayName: string;
  joinedAt: number;
  roles: string[];
}

interface AuthorMessageReference {
  messageId: string;
  channelId: string;
  authorId: string;
}

interface ExecutorAndAuthorMessageReference extends AuthorMessageReference {
  executorId: string;
}

interface BeforeAfter<T = string> {
  before: T;
  after: T;
}

interface ActionReference {
  userId: string;
  executorId: string;
}

/** Type for the "Discord Logs"'s mongoose schema */
export type DiscordLogBase = { severity: 1 | 2 | 3; guildId: string }
  & (
    // Context is user id, content is the nickname before and after
    | { type: DiscordLogType.ChangeNickname; context: ActionReference; content: BeforeAfter }
    // Context is user id, content is the username before and after
    | { type: DiscordLogType.ChangeUsername; context: string; content: BeforeAfter }
    // Context is user id, content is list of possible invite-code used
    | { type: DiscordLogType.GuildJoin; context: string; content: string[] }
    // Context is user id, content is a snapshot of the user
    | { type: DiscordLogType.GuildLeave; context: string; content: GuildLeaveUserSnapshot }
    // Context is a AuthorMessageReference, content is a list of linked invites
    | { type: DiscordLogType.InvitePost; context: AuthorMessageReference; content: string[] }
    // Context is a AuthorMessageReference, content is the message content before and after
    | { type: DiscordLogType.MessageEdit; context: AuthorMessageReference; content: BeforeAfter }
    // Context is a AuthorMessageReference, content is the new message content
    | { type: DiscordLogType.MessagePost; context: AuthorMessageReference; content: string }
    // Context is a ExecutorAndAuthorMessageReference, content is the message content
    | { type: DiscordLogType.MessageRemove; context: ExecutorAndAuthorMessageReference; content: string }
    // Context is a ExecutorAndAuthorMessageReference, content is the emoji used
    | { type: DiscordLogType.ReactionAdd; context: ExecutorAndAuthorMessageReference; content: string }
    // Context is a ExecutorAndAuthorMessageReference, content is the emoji used
    | { type: DiscordLogType.ReactionRemove; context: ExecutorAndAuthorMessageReference; content: string }
    // Context is ActionReference, content is the roles id
    | { type: DiscordLogType.RoleAdd; context: ActionReference; content: string[] }
    // Context is ActionReference, content is the roles id
    | { type: DiscordLogType.RoleRemove; context: ActionReference; content: string[] }
    // Context is user id, content is the channel id
    | { type: DiscordLogType.VoiceJoin; context: string; content: string }
    // Context is user id, content is the channel id
    | { type: DiscordLogType.VoiceLeave; context: string; content: string }
    // Context is user id, content is the channel id before and after
    | { type: DiscordLogType.VoiceMove; context: string; content: BeforeAfter }
  );

/** Simplified interface for the "Discord Logs"'s mongoose schema */
interface SimpleDiscordLogBase {
  severity: 1 | 2 | 3;
  guildId: string;
  type: DiscordLogType;
  context: ActionReference | AuthorMessageReference | ExecutorAndAuthorMessageReference | string;
  content: BeforeAfter | GuildLeaveUserSnapshot | string[] | string;
}

/** Simplified interface for the "Discord Logs"'s mongoose document */
export interface DiscordLogDocument extends SimpleDiscordLogBase, Document {}

/** Interface for the "Discord Logs"'s mongoose model */
export type DiscordLogModel = Model<DiscordLogDocument>;
// #endregion

/* ***************************** */
/*  Log Statuses Database Types  */
/* ***************************** */

// #region Log Statuses Database Types
/** Enum for the "Log Statuses"'-type mongoose schema */
export enum LogStatuses {
  Disabled,
  Silent,
  Console,
  Discord,
}

/** Type for the "Log Statuses"'s mongoose schema */
export interface LogStatusesBase {
  guildId: string;
  type: DiscordLogType;
  status: LogStatuses;
}

/** Simplified interface for the "Log Statuses"'s mongoose document */
export interface LogStatusesDocument extends LogStatusesBase, Document {}

/** Interface for the "Log Statuses"'s mongoose model */
export type LogStatusesModel = Model<LogStatusesDocument>;
// #endregion

/* ***************************** */
/*     Contact Database Types    */
/* ***************************** */

// #region Contact Database Types
/** Type for the "Contact"'s mongoose schema */
export interface ContactBase {
  team: string;
  name: string;
  contact: string;
  description: string;
}

/** Simplified interface for the "Contact"'s mongoose document */
export interface ContactDocument extends ContactBase, Document {}

/** Interface for the "Contact"'s mongoose model */
export type ContactModel = Model<ContactDocument>;
// #endregion
