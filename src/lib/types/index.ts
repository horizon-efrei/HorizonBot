import type { CommandOptions } from '@sapphire/framework';
import type {
 Guild,
 GuildMember,
 Message,
 NewsChannel,
 Role,
 TextChannel,
} from 'discord.js';
import type MonkaClient from '../structures/MonkaClient';

/* ************ */
/*  Util types  */
/* ************ */

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/* ********************************************** */
/*  Define the core-js "Array#uniqueBy" polyfill  */
/* ********************************************** */

type Resolver<T> = (item: T) => unknown;
type Indexer<T> = number | symbol | keyof T;
type ValueResolver<T> = Indexer<T> | Resolver<T>;

declare global {
  interface Array<T> {
    uniqueBy(valueResolver?: ValueResolver<T>): T[];
  }
}

/* ******************************************* */
/*  Custom Types used all across the codebase  */
/* ******************************************* */

export type MonkaCommandOptions = CommandOptions & {
  usage: string;
  examples: string[];
  runnableBy: string;
};

export type GuildTextBasedChannel = NewsChannel | TextChannel;

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

