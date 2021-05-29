import type { ArgumentContext, AsyncArgumentResult } from '@sapphire/framework';
import { Argument, Identifiers } from '@sapphire/framework';
import settings from '@/config/settings';

export default class BooleanArgument extends Argument<boolean> {
  public async run(parameter: string, context: ArgumentContext<boolean>): AsyncArgumentResult<boolean> {
    const boolean = parameter.toLowerCase();

    const truths = settings.configuration.booleanTruths;
    const falses = settings.configuration.booleanFalses;

    if (truths.includes(boolean))
      return this.ok(true);
    if (falses.includes(boolean))
      return this.ok(false);

    const possibles = [...truths, ...falses];
    return this.error({
      parameter,
      identifier: Identifiers.ArgumentBoolean,
      context: { ...context, possibles, count: possibles.length },
    });
  }
}
