import type { CommandOptions } from '@sapphire/framework';

export type MonkaCommandOptions = CommandOptions & {
  usage: string;
  examples: string[];
  runnableBy: string;
};
