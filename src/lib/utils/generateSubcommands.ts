import type { SubCommandManager } from '@sapphire/plugin-subcommands';

export const commonSubcommands = {
  create: { aliases: ['add', 'new', 'set'] },
  list: { aliases: ['liste', 'ls', 'show'] },
  edit: { aliases: ['change', 'modify'] },
  remove: { aliases: ['delete', 'rm', 'del'] },
  help: { aliases: ['aide'] },
};

type DefaultSubCommands = keyof typeof commonSubcommands;
type SubcommandRaw = Record<string, { aliases?: string[]; default?: boolean }>;

function getEntries(subcommand: { name: string; aliases?: string[]; default?: boolean }): SubCommandManager.Entry[] {
  const allSubcommands: SubCommandManager.Entry[] = [];

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
  common: DefaultSubCommands[],
  args?: DefaultSubCommands | SubcommandRaw,
  defaultOverwrite?: DefaultSubCommands,
): SubCommandManager.RawEntries {
  const finalArguments: SubCommandManager.Entry[] = [];

  for (const name of common)
    finalArguments.push(...getEntries({ name, ...commonSubcommands[name] }));

  if (typeof args === 'object') {
    for (const [name, options] of Object.entries(args))
      finalArguments.push(...getEntries({ name, ...options }));
  }

  if (!finalArguments.some(arg => arg.default)) {
    const defaultSubCommand = typeof args === 'string'
      ? args
      : typeof defaultOverwrite === 'string'
      ? defaultOverwrite
      : 'help';
    for (const argument of finalArguments)
      argument.default = argument.input === defaultSubCommand;
  }

  return finalArguments;
}
