import type { PieceContext } from '@sapphire/framework';
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import type { HorizonCommandOptions } from '@/types';

export default abstract class HorizonSubCommand extends SubCommandPluginCommand {
  usage: string;
  examples: string[];
  runnableBy: string;

  constructor(context: PieceContext, options: HorizonCommandOptions) {
    super(context, options);

    this.usage = options?.usage || '';
    this.examples = options?.examples || [];
    this.runnableBy = options?.runnableBy || '';
  }
}
