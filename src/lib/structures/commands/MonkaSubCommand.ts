import type { PieceContext } from '@sapphire/framework';
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import type { MonkaCommandOptions } from '@/types';

export default abstract class MonkaSubCommand extends SubCommandPluginCommand {
  usage: string;
  examples: string[];
  runnableBy: string;

  constructor(context: PieceContext, options: MonkaCommandOptions) {
    super(context, options);

    this.usage = options?.usage || '';
    this.examples = options?.examples || [];
    this.runnableBy = options?.runnableBy || '';
  }
}
