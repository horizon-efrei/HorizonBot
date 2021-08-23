import { isGuildBasedChannel, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import type { Identifiers, Result } from '@sapphire/framework';
import { err, ok, Resolvers } from '@sapphire/framework';
import type { Message } from 'discord.js';
import type { GuildTextBasedChannel } from '@/types';

export default function resolveGuildTextBasedChannel(
  parameter: string,
  message: Message,
): Result<GuildTextBasedChannel, Identifiers.ArgumentChannelError | 'guildTextBasedChannelError'> {
  const resolved = Resolvers.resolveChannel(parameter, message);
  if (resolved.error)
    return err(resolved.error);

  return isTextBasedChannel(resolved.value) && isGuildBasedChannel(resolved.value)
    ? ok(resolved.value)
    : err('guildTextBasedChannelError');
}
