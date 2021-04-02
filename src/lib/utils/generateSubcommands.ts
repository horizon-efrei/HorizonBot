import type { SubCommandManager } from '@sapphire/plugin-subcommands';
import type { Writeable } from '@/types';

type SubcommandRaw = Record<string, { aliases?: string[]; default?: boolean }>;

export default function generateSubcommands(args: SubcommandRaw): SubCommandManager.RawEntries {
  const finalArguments: Writeable<SubCommandManager.RawEntries> = [];

  for (const [name, options] of Object.entries(args)) {
    finalArguments.push({ input: name, default: options.default });

    for (const alias of (options.aliases ?? []))
      finalArguments.push({ input: alias, output: name });
  }

  return finalArguments;
}
