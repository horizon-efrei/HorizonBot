import { isGuildBasedChannel, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import type { ArgumentResult, ExtendedArgumentContext, PieceContext } from '@sapphire/framework';
import { ExtendedArgument } from '@sapphire/framework';
import type { GuildChannel } from 'discord.js';
import type { GuildTextBasedChannel } from '@/types';

export default class GuildTextBasedChannelArgument extends ExtendedArgument<'guildChannel', GuildTextBasedChannel> {
  constructor(context: PieceContext) {
    super(context, {
      name: 'guildTextBasedChannel',
      baseArgument: 'guildChannel',
    });
  }

  public handle(channel: GuildChannel, context: ExtendedArgumentContext): ArgumentResult<GuildTextBasedChannel> {
    return isTextBasedChannel(channel) && isGuildBasedChannel(channel)
      ? this.ok(channel as GuildTextBasedChannel)
      : this.error({
          parameter: context.parameter,
          message: 'The argument did not resolve to a guild text-based channel.',
          context: { ...context, channel },
        });
  }
}
