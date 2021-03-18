import type ConfigurationManager from '@/structures/ConfigurationManager';
import type MonkaCommand from '@/structures/MonkaCommand';
import type { CodeLanguageResult } from '@/types';

declare module 'discord.js' {
  interface Client {
    checkValidity(): void;
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    configurationManager: ConfigurationManager;
    remainingCompilerApiCredits: number;
  }

  interface ArgType {
    code: string;
    codeLanguage: CodeLanguageResult;
    command: MonkaCommand;
  }
}
