import { Listener } from '@sapphire/framework';
import type { Invite } from 'discord.js';

export default class InviteCreateListener extends Listener {
  public async run(invite: Invite): Promise<void> {
    if ('invites' in invite.guild)
      await invite.guild.invites.fetch();
  }
}
