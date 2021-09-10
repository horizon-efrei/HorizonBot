import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import * as CustomResolvers from '@/resolvers';
import type { HourMinutes } from '@/types';

export default class HourArgument extends Argument<HourMinutes> {
  public run(parameter: string, context: ArgumentContext<HourMinutes>): ArgumentResult<HourMinutes> {
    const resolved = CustomResolvers.resolveHour(parameter);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to an hour.',
      context,
    });
  }
}
