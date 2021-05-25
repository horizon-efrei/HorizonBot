import type { AsyncPreconditionResult, PreconditionContext } from '@sapphire/framework';
import { Precondition } from '@sapphire/framework';
import type MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';

export default class CorePrecondition extends Precondition {
  public async run(
    message: GuildMessage,
    _command: MonkaCommand,
    context: PreconditionContext,
  ): AsyncPreconditionResult {
    if (message.member.roles.cache.has(context.role as string))
      return this.ok();

    if (context.message)
      await message.channel.send(context.message);
    return this.error({
        identifier: 'preconditionCustomRole',
        context: { role: context.role },
      });
  }
}
