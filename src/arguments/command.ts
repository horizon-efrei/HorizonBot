import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import CustomResolvers from '@/resolvers';
import type MonkaCommand from '@/structures/commands/MonkaCommand';

export default class CommandArgument extends Argument<MonkaCommand> {
  public run(parameter: string, context: ArgumentContext<MonkaCommand>): ArgumentResult<MonkaCommand> {
    const resolved = CustomResolvers.resolveCommand(parameter);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a command.',
      context,
    });
  }
}
