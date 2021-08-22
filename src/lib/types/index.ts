import type { CommandOptions } from '@sapphire/framework';
import type {
  DMChannel,
  Guild,
  GuildMember,
  Message,
  PartialDMChannel,
  Role,
} from 'discord.js';
import type MonkaClient from '@/structures/MonkaClient';

/* ************ */
/*  Util types  */
/* ************ */

export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/* ******************************************* */
/*  Custom Types used all across the codebase  */
/* ******************************************* */

export enum SchoolYear {
  L1 = 'l1',
  L2 = 'l2',
  L3 = 'l3',
}

export type MonkaCommandOptions = CommandOptions & {
  usage: string;
  examples: string[];
  runnableBy: string;
};

export type GuildTextBasedChannel = Exclude<Message['channel'], DMChannel | PartialDMChannel>;

export interface GuildMessage extends Message {
  channel: GuildTextBasedChannel;
  readonly client: MonkaClient;
  readonly guild: Guild;
  readonly member: GuildMember;
}

export interface CodeLanguageResult {
  display: string;
  language: string;
  slugs: string[];
  version: string;
  versionIndex: string;
}

export interface ReactionRolePair {
  reaction: string;
  role: Role;
}

export interface HourMinutes {
  hour: number;
  minutes: number;
  formatted: string;
}

export interface DurationPart {
  number: string;
  unit: string;
}

export interface ReactionRoleReturnPayload {
  isError: boolean;
  errorPayload?: {
    reactions?: string[];
    roles?: string[];
  };
  reactionRoles: ReactionRolePair[];
}
