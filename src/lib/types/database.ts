import type { Document, Model } from 'mongoose';

/** Enum for the "Configuration"'s mongoose schema */
export enum ConfigEntries {
  ModeratorFeedback = 'moderator-feedback-channel',
}

/** Interface for the "Configuration"'s mongoose schema */
export interface ConfigurationBase {
  name: ConfigEntries;
  value: string;
}

/** Interface for the "Configuration"'s mongoose document */
export interface ConfigurationDocument extends ConfigurationBase, Document {}

/** Interface for the "Configuration"'s mongoose model */
export type ConfigurationModel = Model<ConfigurationDocument>;
