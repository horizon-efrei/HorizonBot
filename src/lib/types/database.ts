import type {
  ChannelType,
  GuildMember,
  GuildTextBasedChannel,
  OverwriteType,
  Role,
} from 'discord.js';
import type { Document, Model, Types } from 'mongoose';
import type { SchoolYear, TeachingUnit } from '@/types';

/* ****************************** */
/*  Configuration Database Types  */
/* ****************************** */

// #region Configuration Database Types
/** Enum for the "Configuration"'s mongoose schema */
export enum ConfigEntriesChannels {
  ClassAnnouncementL1 = 'channel-class-announcement-l1',
  ClassAnnouncementL2 = 'channel-class-announcement-l2',
  ClassAnnouncementL3 = 'channel-class-announcement-l3',
  Logs = 'channel-logs',
  WeekUpcomingClasses = 'channel-week-upcoming-classes',
}

export enum ConfigEntriesRoles {
  Eprof = 'role-eprof',
  SchoolYearL1 = 'role-l1',
  SchoolYearL2 = 'role-l2',
  SchoolYearL3 = 'role-l3',
  Staff = 'role-staff',
}

export type ConfigEntries = ConfigEntriesChannels | ConfigEntriesRoles;

export type ConfigEntryHolds = GuildTextBasedChannel | Role;

/** Interface for the "Configuration"'s mongoose schema */
export interface ConfigurationBase {
  name: ConfigEntries;
  guildId: string;
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
/** Enum for the eclass' current status */
export enum EclassStatus {
  Planned,
  InProgress,
  Finished,
  Canceled,
}

/** Enum for the eclass' current steps */
export enum EclassStep {
  None = 'none',
  Reminded = 'reminded',
  CleanedUp = 'cleaned-up',
}

/** Enum for the eclass' place */
export enum EclassPlace {
  Discord = 'discord',
  Teams = 'teams',
  OnSite = 'on-site',
  Other = 'other',
}

/** Interface for the "Eclass"'s mongoose schema */
export interface EclassBase {
  classId: string;
  guildId: string;
  topic: string;
  subject: SubjectDocument | Types.ObjectId;
  date: Date;
  duration: number;
  end: Date;
  professorId: string;
  classRoleId: string;
  targetRoleId: string;
  place: EclassPlace;
  placeInformation: string | null;
  announcementChannelId: ConfigEntriesChannels;
  announcementMessageId: string;
  status: EclassStatus;
  step: EclassStep;
  subscriberIds: string[];
  isRecorded: boolean;
  recordLinks: string[];
}

/** Interface for the "Eclass"'s mongoose document */
interface EclassBaseDocument extends EclassBase, Document {
  subscriberIds: Types.Array<string>;
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
  textChannelId: string;
  textDocsChannelId?: string;
  voiceChannelId?: string;
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
  expiration: Date;
}

/** Interface for the "RoleIntersection"'s mongoose document */
export interface RoleIntersectionDocument extends RoleIntersectionBase, Document {}

/** Interface for the "RoleIntersection"'s mongoose model */
export type RoleIntersectionModel = Model<RoleIntersectionDocument>;
// #endregion

/* ******************** */
/*  Tag Database Types  */
/* ******************** */

// #region Tag Database Types
/** Interface for the "Tag"'s mongoose schema */
export interface TagBase {
  name: string;
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
  date: Date;
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
  ChannelCreate = 'channel-create',
  ChannelUpdate = 'channel-update',
  ChannelDelete = 'channel-delete',

  GuildJoin = 'guild-join',
  GuildLeave = 'guild-leave',

  InvitePost = 'invite-post',
  MessageCreate = 'message-create',
  MessageUpdate = 'message-update',
  MessageDelete = 'message-delete',
  MessageDeleteBulk = 'message-delete-bulk',

  MemberNicknameUpdate = 'member-nickname-update',
  MemberRoleAdd = 'member-role-add',
  MemberRoleRemove = 'member-role-remove',

  ReactionAdd = 'reaction-add',
  ReactionRemove = 'reaction-remove',

  RoleCreate = 'role-create',
  RoleUpdate = 'role-update',
  RoleDelete = 'role-delete',

  UserUsernameUpdate = 'user-username-update',

  VoiceJoin = 'voice-join',
  VoiceMove = 'voice-move',
  VoiceLeave = 'voice-leave',
}

interface BeforeAfter<T> {
  before: T;
  after: T;
}

interface AuthorMessageReference {
  messageId: string;
  channelId: string;
  authorId: string;
}

interface ExecutorReference {
  executorId?: string;
}

interface ExecutorAndAuthorMessageReference extends AuthorMessageReference, ExecutorReference {}

interface UserActionReference extends ExecutorReference {
  userId: string;
}

interface RoleActionReference extends ExecutorReference {
  roleId: string;
}

interface ChannelActionReference extends ExecutorReference {
  channelId: string;
}

export interface AttachmentInfos {
  url: string;
  name: string;
}

interface MessageContent {
  messageContent: string;
  attachments: AttachmentInfos[];
}

export interface GuildLeaveUserSnapshot {
  userId: string;
  username: string;
  displayName: string;
  joinedAt: number | null;
  roles: string[];
}

interface MessageSnapshot extends MessageContent {
  messageId: string;
  authorId: string;
  authorTag: string;
  createdAt: Date;
}

export interface ChannelSnapshot {
  id: string;
  flags: number;
  name: string;
  parentId: string | null;
  permissionOverwrites: Record<string, {
    id: string;
    type: OverwriteType;
    allow: `${bigint}`;
    deny: `${bigint}`;
  }>;
  permissionsLocked: boolean | null;
  position: number;
  type: Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM>;
}

export interface RoleSnapshot {
  id: string;
  name: string;
  hexColor: string;
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  permissions: `${bigint}`;
  position: number;
}

type UserId = string;
type ChannelId = string;
type RoleId = string;
type Invitation = string;
type Emoji = string;

/** Type for the "Discord Logs"'s mongoose schema */
export type DiscordLogBase = { severity: 1 | 2 | 3; guildId: string }
  & (
    /* eslint-disable @typescript-eslint/sort-type-constituents */
    | { type: DiscordLogType.ChannelCreate; context: ChannelActionReference; content: ChannelSnapshot }
    | { type: DiscordLogType.ChannelUpdate; context: ChannelActionReference; content: BeforeAfter<ChannelSnapshot> }
    | { type: DiscordLogType.ChannelDelete; context: ChannelActionReference; content: ChannelSnapshot }

    // The content is the possible invite-code used
    | { type: DiscordLogType.GuildJoin; context: UserId; content: Invitation[] }
    | { type: DiscordLogType.GuildLeave; context: UserId; content: GuildLeaveUserSnapshot }

    // The content is the linked invites
    | { type: DiscordLogType.InvitePost; context: AuthorMessageReference; content: Invitation[] }
    | { type: DiscordLogType.MessageCreate; context: AuthorMessageReference; content: MessageContent }
    | { type: DiscordLogType.MessageUpdate; context: AuthorMessageReference; content: BeforeAfter<MessageContent> }
    | { type: DiscordLogType.MessageDelete; context: ExecutorAndAuthorMessageReference; content: MessageContent }
    | {
        type: DiscordLogType.MessageDeleteBulk;
        context: ExecutorReference & { channelId: ChannelId };
        content: MessageSnapshot[];
      }

    // The content is the nickname
    | { type: DiscordLogType.MemberNicknameUpdate; context: UserActionReference; content: BeforeAfter<string> }
    // The content is the role IDs
    | { type: DiscordLogType.MemberRoleAdd; context: UserActionReference; content: RoleId[] }
    // The content is the role IDs
    | { type: DiscordLogType.MemberRoleRemove; context: UserActionReference; content: RoleId[] }

    // The content is the emoji used
    | { type: DiscordLogType.ReactionAdd; context: ExecutorAndAuthorMessageReference; content: Emoji }
    // The content is the emoji used
    | { type: DiscordLogType.ReactionRemove; context: ExecutorAndAuthorMessageReference; content: Emoji }

    | { type: DiscordLogType.RoleCreate; context: RoleActionReference; content: RoleSnapshot }
    | { type: DiscordLogType.RoleUpdate; context: RoleActionReference; content: BeforeAfter<RoleSnapshot> }
    | { type: DiscordLogType.RoleDelete; context: RoleActionReference; content: RoleSnapshot }

    // The content is the username
    | { type: DiscordLogType.UserUsernameUpdate; context: UserId; content: BeforeAfter<string> }

    | { type: DiscordLogType.VoiceJoin; context: UserId; content: ChannelId }
    | { type: DiscordLogType.VoiceMove; context: UserId; content: BeforeAfter<ChannelId> }
    | { type: DiscordLogType.VoiceLeave; context: UserId; content: ChannelId }
    /* eslint-enable @typescript-eslint/sort-type-constituents */
  );

/** Simplified interface for the "Discord Logs"'s mongoose schema */
interface SimpleDiscordLogBase {
  severity: 1 | 2 | 3;
  guildId: string;
  type: DiscordLogType;
  context:
    | AuthorMessageReference
    | ChannelActionReference
    | ExecutorAndAuthorMessageReference
    | UserActionReference
    | string;
  content:
    | BeforeAfter<ChannelSnapshot>
    | BeforeAfter<RoleSnapshot>
    | BeforeAfter<string>
    | ChannelSnapshot
    | GuildLeaveUserSnapshot
    | RoleSnapshot
    | string[]
    | string;
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
  guildId: string;
  description: string;
}

/** Simplified interface for the "Contact"'s mongoose document */
export interface ContactDocument extends ContactBase, Document {}

/** Interface for the "Contact"'s mongoose model */
export type ContactModel = Model<ContactDocument>;
// #endregion
