import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import * as CustomResolvers from '@/resolvers';

export default class DayArgument extends Argument<Date> {
  public run(parameter: string, context: ArgumentContext<Date> & { canBePast: boolean }): ArgumentResult<Date> {
    const resolved = CustomResolvers.resolveDate(parameter, context);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a date.',
      context,
    });
  }
}
