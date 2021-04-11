import type { Document, Model } from 'mongoose';

/* ****************************** */
/*  Configuration Database Types  */
/* ****************************** */

/** Enum for the "Configuration"'s mongoose schema */
export enum ConfigEntries {
  ModeratorFeedback = 'moderator-feedback-channel',
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

/* ***************************** */
/*  ReactionRole Database Types  */
/* ***************************** */

/** Interface for the "ReactionRole"'s mongoose schema */
export interface ReactionRoleBase {
  messageId: string;
  channelId: string;
  guildId: string;
  reactionRolePairs: Array<{ role: string; reaction: string }>;
}

/** Interface for the "ReactionRole"'s mongoose document */
export interface ReactionRoleDocument extends ReactionRoleBase, Document {}

/** Interface for the "ReactionRole"'s mongoose model */
export type ReactionRoleModel = Model<ReactionRoleDocument>;
