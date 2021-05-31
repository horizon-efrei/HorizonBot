import type { GuildMember } from 'discord.js';
import type { Document, Model, Types } from 'mongoose';

/* ****************************** */
/*  Configuration Database Types  */
/* ****************************** */

// #region Configuration Database Types
/** Enum for the "Configuration"'s mongoose schema */
export enum ConfigEntries {
  ModeratorFeedback = 'moderator-feedback-channel',
  ClassAnnoucementL1 = 'class-announcement-l1',
  ClassAnnoucementL2 = 'class-announcement-l2',
  ClassAnnoucementL3 = 'class-announcement-l3',
  ClassAnnoucementGeneral = 'class-announcement-general',
  WeekUpcomingClasses = 'week-upcoming-classes',
}

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
  classChannel: string;
  guild: string;
  topic: string;
  subject: string;
  date: number;
  duration: number;
  end: number;
  professor: string;
  classRole: string;
  targetRole: string;
  announcementMessage: string;
  announcementChannel: ConfigEntries;
  status: EclassStatus;
  reminded: boolean;
  classId: string;
  subscribers: string[];
  isRecorded: boolean;
}

export type PrettyEclass = Omit<EclassBase, 'date' | 'duration' | 'end'> & { date: string; duration: string; end: string };

/** Interface for the "Eclass"'s mongoose document */
export interface EclassDocument extends EclassBase, Document {
  toData(): PrettyEclass;
}

/** Interface for the "Eclass"'s mongoose model */
export interface EclassModel extends Model<EclassDocument> {
  generateId(topic: string, professor: GuildMember, date: Date): string;
}
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
