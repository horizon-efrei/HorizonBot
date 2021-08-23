import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import CustomResolvers from '@/resolvers';

export default class CodeArgument extends Argument<number> {
  public run(parameter: string, context: ArgumentContext<number>): ArgumentResult<number> {
    const resolved = CustomResolvers.resolveDuration(parameter);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a duration.',
      context,
    });
  }
}
