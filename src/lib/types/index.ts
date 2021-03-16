import type { CommandOptions } from '@sapphire/framework';
import type {
 Guild,
 GuildMember,
 Message,
 NewsChannel,
 TextChannel,
} from 'discord.js';

export type MonkaCommandOptions = CommandOptions & {
  usage: string;
  examples: string[];
  runnableBy: string;
};

export type GuildTextBasedChannel = NewsChannel | TextChannel;

export interface GuildMessage extends Message {
  channel: GuildTextBasedChannel;
  readonly guild: Guild;
  readonly member: GuildMember;
}
