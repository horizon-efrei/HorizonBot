import type { Guild } from 'discord.js';
import { noop, nullop } from './noop';
import { sleep } from './sleep';

/**
 * Send DMs to a list of guild-members, with throttling.
 * @param guild The guild
 * @param memberIds The list of member IDs
 * @param text The text to send
 */
export async function massSend(guild: Guild, memberIds: string[], text: string): Promise<void> {
  const shouldThrottle = memberIds.length > 30;

  for (const [i, memberId] of memberIds.entries()) {
    if (shouldThrottle && i % 10 === 0 && i !== 0)
      await sleep(5000);

    const member = await guild.members.fetch({ user: memberId, cache: false }).catch(nullop);
    if (member)
      await member.send(text).catch(noop);
  }
}
