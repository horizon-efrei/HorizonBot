import type { Guild } from 'discord.js';
import { noop, nullop } from './noop';
import sleep from './sleep';

export default async function massSend(guild: Guild, memberIds: string[], text: string): Promise<void> {
  const shouldThrottle = memberIds.length > 30;

  for (const [i, memberId] of memberIds.entries()) {
    if (shouldThrottle && i % 10 === 0 && i !== 0)
      await sleep(2000);

    const member = guild.members.resolve(memberId)
      ?? await guild.members.fetch({ user: memberId, cache: false }).catch(nullop);
    if (member)
      await member.send(text).catch(noop);
  }
}
