import type { Collection } from 'discord.js';
import type { ConfigurationManager } from '@/structures/ConfigurationManager';
import type { TaskStore } from '@/structures/tasks/TaskStore';
import type { DiscordLogType, LogStatuses, ReminderDocument } from '@/types/database';
import type { SubjectsManager } from '../structures/SubjectsManager';

declare module '@sapphire/framework' {
  interface StoreRegistryEntries {
    tasks: TaskStore;
  }

  interface SapphireClient {
    configManager: ConfigurationManager;
    subjectsManager: SubjectsManager;
    remainingCompilerApiCredits: number;
    reactionRolesIds: Set<string>;
    currentlyRunningEclassIds: Set<string>;
    eclassRolesIds: Set<string>;
    roleIntersections: Set<string>;
    reminders: Map<string, ReminderDocument>;
    logStatuses: Collection<string, Collection<DiscordLogType, LogStatuses>>;

    loading: Promise<void>;

    checkValidity(): void;
    cacheReminders(): Promise<void>;
  }
}
