import type { AsyncPreconditionResult } from '@sapphire/framework';
import { Identifiers, Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';

export default class AdminOnlyPrecondition extends Precondition {
  public async run(message: Message): AsyncPreconditionResult {
    if (message.member.permissions.has('ADMINISTRATOR'))
      return this.ok();
    return this.error({ identifier: Identifiers.PreconditionAdminOnly, message: 'You cannot run this command without the "Administrator" permission.' });
  }
}
