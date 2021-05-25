import type ConfigurationManager from '@/structures/ConfigurationManager';
import type FlaggedMessage from '@/structures/FlaggedMessage';
import type MonkaCommand from '@/structures/MonkaCommand';
import type TaskStore from '@/structures/TaskStore';
import type { CodeLanguageResult, GuildTextBasedChannel, HourMinutes } from '@/types';


declare module 'discord.js' {
  interface Client {
    checkValidity(): void;
  }
}

declare module '@sapphire/framework' {
  enum Events {
    TaskError = 'taskError',
  }

  interface StoreRegistryEntries {
    tasks: TaskStore;
  }

  interface SapphireClient {
    configManager: ConfigurationManager;
    remainingCompilerApiCredits: number;
    reactionRolesIds: Set<string>;
    eclassRolesIds: Set<string>;
    waitingFlaggedMessages: FlaggedMessage[];
    intersectionRoles: Set<string>;
  }

  interface ArgType {
    code: string;
    codeLanguage: CodeLanguageResult;
    command: MonkaCommand;
    day: Date;
    duration: number;
    guildTextBasedChannel: GuildTextBasedChannel;
    hour: HourMinutes;
  }
}
