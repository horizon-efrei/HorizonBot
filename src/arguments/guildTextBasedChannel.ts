import type { ArgumentContext, ArgumentResult } from '@sapphire/framework';
import { Argument } from '@sapphire/framework';
import * as CustomResolvers from '@/resolvers';
import type { GuildTextBasedChannel } from '@/types';

export default class GuildTextBasedChannelArgument extends Argument<GuildTextBasedChannel> {
  public run(parameter: string, context: ArgumentContext): ArgumentResult<GuildTextBasedChannel> {
    const resolved = CustomResolvers.resolveGuildTextBasedChannel(parameter, context.message);

    if (resolved.success)
      return this.ok(resolved.value);
    return this.error({
      parameter,
      identifier: resolved.error,
      message: 'The argument did not resolve to a guild text-based channel.',
      context,
    });
  }
}
