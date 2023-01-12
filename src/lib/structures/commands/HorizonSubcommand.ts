import type { PieceContext } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import type { CacheType } from 'discord.js';
import type { SubcommandConfiguration } from '@/types';

export abstract class HorizonSubcommand<Config extends SubcommandConfiguration> extends Subcommand {
  descriptions: Config['descriptions'];
  messages: Config['messages'];

  constructor(context: PieceContext, options: HorizonSubcommand.Options) {
    super(context, options);

    this.descriptions = options.descriptions;
    this.messages = options.messages;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-redeclare
export namespace HorizonSubcommand {
  export type Options = Subcommand.Options & SubcommandConfiguration;
  export type JSON = Subcommand.JSON;
  export type Context = Subcommand.Context;
  export type RunInTypes = Subcommand.RunInTypes;
  export type ChatInputInteraction<Cached extends CacheType = CacheType> =
    Subcommand.ChatInputCommandInteraction<Cached>;
  export type ContextMenuInteraction<Cached extends CacheType = CacheType> =
    Subcommand.ContextMenuCommandInteraction<Cached>;
  export type AutocompleteInteraction<Cached extends CacheType = CacheType> =
    Subcommand.AutocompleteInteraction<Cached>;
  export type Registry = Subcommand.Registry;
}
