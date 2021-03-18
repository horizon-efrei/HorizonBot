import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import type MonkaCommand from '@/structures/MonkaCommand';
import type MonkaCommandStore from '@/structures/MonkaCommandStore';

export default class CommandArgument extends Argument<MonkaCommand> {
  public run(arg: string, context: ArgumentContext<MonkaCommand>): ArgumentResult<MonkaCommand> {
    const command = (context.command.context.stores
      .get('commands') as MonkaCommandStore)
      .find(cmd => cmd.aliases.includes(arg));

    return command
      ? this.ok(command)
      : this.error({ parameter: arg });
  }
}
