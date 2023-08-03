import { EmojiRegex } from '@sapphire/discord.js-utilities';
import type { Result } from '@sapphire/framework';
import { err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type { Guild, GuildEmoji } from 'discord.js';
import * as nodeEmoji from 'node-emoji';

function getFromGuild(guild: Guild, parameter: string): GuildEmoji | undefined {
  const parsed = EmojiRegex.exec(parameter)?.[3];
  if (!parsed)
    return;
  return guild.emojis.cache.get(parsed);
}

export function resolveEmoji(parameter: string, guild: Guild): Result<string, 'emojiError'> {
  if (!parameter)
    return err('emojiError');

  const regex = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{1F1E6}-\u{1F1FF}]/gu;
  const emoji = nodeEmoji.find(parameter)?.emoji
    ?? getFromGuild(guild, parameter)?.toString()
    ?? parameter.match(regex)?.[0];
  if (isNullish(emoji))
    return err('emojiError');
  return ok(emoji);
}

export function resolveCompleteEmoji(parameter: string, guild: Guild): Result<GuildEmoji | string, 'emojiError'> {
  if (!parameter)
    return err('emojiError');

  const regex = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{1F1E6}-\u{1F1FF}]/gu;
  const emoji = nodeEmoji.find(parameter)?.emoji
    ?? getFromGuild(guild, parameter)
    ?? parameter.match(regex)?.[0];
  if (isNullish(emoji))
    return err('emojiError');
  return ok(emoji);
}
