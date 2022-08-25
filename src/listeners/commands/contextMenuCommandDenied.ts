import type { ContextMenuCommandDeniedPayload, Events, UserError } from '@sapphire/framework';
import { Listener, PreconditionError } from '@sapphire/framework';
import messages from '@/config/messages';

export default class ContextMenuCommandDeniedListener extends Listener<typeof Events.ContextMenuCommandDenied> {
  public async run(error: UserError, payload: ContextMenuCommandDeniedPayload): Promise<void> {
    if (error instanceof PreconditionError) {
      const errorKey = Object.keys(messages.errors.precondition).includes(error.identifier)
        ? error.identifier as keyof typeof messages.errors.precondition
        : 'unknownError';
      await payload.interaction.reply({
        content: messages.errors.precondition[errorKey],
        ephemeral: true,
      });
    }
  }
}
