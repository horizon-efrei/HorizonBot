import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import * as CustomResolvers from '@/resolvers';

export default class CodeArgument extends Argument<string> {
  public run(parameter: string, context: ArgumentContext<string>): ArgumentResult<string> {
    const resolved = CustomResolvers.resolveCode(parameter);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a code block.',
      context,
    });
  }
}
