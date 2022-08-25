import type { PieceContext } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import type { CacheType } from 'discord.js';
import type { CommandConfiguration } from '@/types';

export abstract class HorizonCommand<Config extends CommandConfiguration> extends Command {
  descriptions: Config['descriptions'];
  messages: Config['messages'];

  constructor(context: PieceContext, options: HorizonCommand.Options) {
    super(context, {
      ...options,
      name: options.descriptions.name,
      description: options.descriptions?.command,
    });

    this.descriptions = options.descriptions;
    this.messages = options.messages;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-redeclare
export namespace HorizonCommand {
  export type Options = Command.Options & CommandConfiguration;
  export type JSON = Command.JSON;
  export type Context = Command.Context;
  export type RunInTypes = Command.RunInTypes;
  export type ChatInputInteraction<Cached extends CacheType = CacheType> = Command.ChatInputInteraction<Cached>;
  export type ContextMenuInteraction<Cached extends CacheType = CacheType> = Command.ContextMenuInteraction<Cached>;
  export type AutocompleteInteraction<Cached extends CacheType = CacheType> = Command.AutocompleteInteraction<Cached>;
  export type Registry = Command.Registry;
}
