import type { PieceContext } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import type { HorizonCommandOptions } from '@/types';

export default abstract class HorizonCommand extends Command {
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
