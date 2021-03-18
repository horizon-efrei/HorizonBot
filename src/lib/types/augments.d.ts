import type ConfigurationManager from '@/structures/ConfigurationManager';

declare module 'discord.js' {
  interface Client {
    checkValidity(): void;
  }
}

declare module '@sapphire/framework' {
  interface SapphireClient {
    configurationManager: ConfigurationManager;
  }

  interface ArgType {
    command: MonkaCommand;
  }
}
