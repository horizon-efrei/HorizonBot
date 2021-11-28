import type { SubCommandManager } from '@sapphire/plugin-subcommands';
import type { Writable } from '@/types';

export const commonSubcommands = {
  create: { aliases: ['create', 'add', 'new', 'set'] },
  list: { aliases: ['list', 'liste', 'ls', 'show'] },
  edit: { aliases: ['edit', 'change', 'modify'] },
  remove: { aliases: ['remove', 'delete', 'rm', 'del'] },
  help: { aliases: ['help', 'aide'], default: true },
};

type SubcommandRaw = Record<string, { aliases?: string[]; default?: boolean }>;

function getEntries(subcommand: { name: string; aliases?: string[]; default?: boolean }): SubCommandManager.RawEntries {
  const allSubcommands: Writable<SubCommandManager.RawEntries> = [];

  allSubcommands.push({ input: subcommand.name, default: subcommand.default ?? false });
  for (const alias of (subcommand.aliases ?? []))
    allSubcommands.push({ input: alias, output: subcommand.name });

  return allSubcommands;
}

/**
 * Generate sapphire-compatible subcommand options from an simplified array.
 * @param args The input options
 * @returns The sapphire-compatible subcommand options
 */
export default function generateSubcommands(
  common: Array<keyof typeof commonSubcommands>,
  args?: SubcommandRaw,
): SubCommandManager.RawEntries {
  const finalArguments: Writable<SubCommandManager.RawEntries> = [];

  for (const name of common)
    finalArguments.push(...getEntries({ name, ...commonSubcommands[name] }));

  if (args) {
    for (const [name, options] of Object.entries(args))
      finalArguments.push(...getEntries({ name, ...options }));
  }

  return finalArguments;
}
