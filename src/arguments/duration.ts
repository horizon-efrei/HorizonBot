import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import { getDuration } from '@/utils';

export default class CodeArgument extends Argument<number> {
  public run(arg: string, _context: ArgumentContext<number>): ArgumentResult<number> {
    try {
      return this.ok(getDuration(arg));
    } catch {
      return this.error({ parameter: arg });
    }
  }
}
