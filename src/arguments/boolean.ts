import type { ArgumentContext, AsyncArgumentResult } from '@sapphire/framework';
import { Argument, Resolvers } from '@sapphire/framework';
import settings from '@/config/settings';

const truths = settings.configuration.booleanTruths;
const falses = settings.configuration.booleanFalses;

export default class BooleanArgument extends Argument<boolean> {
  public async run(parameter: string, context: ArgumentContext<boolean>): AsyncArgumentResult<boolean> {
    const resolved = Resolvers.resolveBoolean(parameter, { truths, falses });

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a boolean.',
      context,
    });
  }
}
