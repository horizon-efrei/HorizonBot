import type { ConfigurationManager } from '@/structures/ConfigurationManager';
import type { TaskStore } from '@/structures/tasks/TaskStore';
import type { SubjectsManager } from '../structures/SubjectsManager';
import type { CacheManager } from './index';

declare module '@sapphire/framework' {
  interface StoreRegistryEntries {
    tasks: TaskStore;
  }

  interface SapphireClient {
    remainingCompilerApiCredits: number;
    loading: Promise<void>;

    checkValidity(): void;
    cacheReminders(): Promise<void>;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    configManager: ConfigurationManager;
    subjectsManager: SubjectsManager;
    caches: CacheManager;
  }
}
