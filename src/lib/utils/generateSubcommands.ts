import type { SubCommandManager } from '@sapphire/plugin-subcommands';
import type { Writable } from '@/types';

type SubcommandRaw = Record<string, { aliases?: string[]; default?: boolean }>;

/**
 * Generate sapphire-compatible subcommand options from an simplified array.
 * @param args The input options
 * @returns The sapphire-compatible subcommand options
 */
export default function generateSubcommands(args: SubcommandRaw): SubCommandManager.RawEntries {
  const finalArguments: Writable<SubCommandManager.RawEntries> = [];

  for (const [name, options] of Object.entries(args)) {
    finalArguments.push({ input: name, default: options.default });

    for (const alias of (options.aliases ?? []))
      finalArguments.push({ input: alias, output: name });
  }

  return finalArguments;
}
