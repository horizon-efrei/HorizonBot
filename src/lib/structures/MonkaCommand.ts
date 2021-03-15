import type { PieceContext } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import type { MonkaCommandOptions } from '@/types';

export default abstract class MonkaCommand extends Command {
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
