import { Listener } from '@sapphire/framework';
import type { Invite } from 'discord.js';

export class InviteCreateListener extends Listener {
  public async run(invite: Invite): Promise<void> {
    if (invite.guild && 'invites' in invite.guild)
      await invite.guild.invites.fetch();
  }
}
