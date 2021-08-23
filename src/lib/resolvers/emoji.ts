import { EmojiRegex } from '@sapphire/discord.js-utilities';
import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/pieces/node_modules/@sapphire/utilities';
import type { Guild } from 'discord.js';
import nodeEmoji from 'node-emoji';

export default function resolveEmoji(parameter: string, guild: Guild): Result<string, 'emojiError'> {
  const emoji = nodeEmoji.find(parameter)?.emoji
    || guild.emojis.cache.get(EmojiRegex.exec(parameter)?.[3])?.toString();
  if (isNullish(emoji))
    return err('emojiError');
  return ok(emoji);
}
