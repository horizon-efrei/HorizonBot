import type { CommandOptions } from '@sapphire/framework';
import type {
 Guild,
 GuildMember,
 Message,
 NewsChannel,
 TextChannel,
} from 'discord.js';
import type MonkaClient from '../structures/MonkaClient';

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
