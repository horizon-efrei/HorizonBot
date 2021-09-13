import { Listener } from '@sapphire/framework';
import type { Guild, GuildMember } from 'discord.js';
import DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

type InviteUses = [code: string, uses: number];

export default class GuildMemberAddListener extends Listener {
  public async run(member: GuildMember): Promise<void> {
    const usedInvite = await this._getUsedInvites(member.guild);

    await DiscordLogManager.logAction({
      type: DiscordLogType.GuildJoin,
      context: member.id,
      content: usedInvite,
      guildId: member.guild.id,
      severity: 1,
    });
  }

  private async _getUsedInvites(guild: Guild): Promise<string[]> {
    // Get the states of the invites before the member joined
    const previousUses = guild.invites.cache.mapValues(invite => invite.uses ?? 0);
    // Refresh the cache
    await guild.invites.fetch();
    // Get the states of the invites after the member joined
    const currentUses = guild.invites.cache.mapValues(invite => invite.uses ?? 0);

    // Get codes which are in both caches, but has increased in the second
    const possibleUsedCode: InviteUses[] = [...previousUses.entries()]
      .filter(([code, uses]) => currentUses.get(code) === uses + 1);

    // Otherwise, this likely means the code was not in one of the caches, so get the difference
    possibleUsedCode.push(...previousUses
      .difference(currentUses)
      .filter(uses => typeof uses === 'number' && uses > 0)
      .map((uses, code): InviteUses => [code, uses]));

    return possibleUsedCode.map(([code]) => code);
  }
}
