import type { Args } from '@sapphire/framework';
import { reactionRole as config } from '@/config/commands/admin';
import ReactionRoles from '@/models/reactionRole';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage } from '@/types';
import type { ReactionRoleDocument } from '@/types/database';

export default function ResolveReactionRoleArgument(options?: { getDocument: boolean }): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args): Promise<void> {
      const rrMessage = (await args.pickResult('message')).value
        || await new ArgumentPrompter(message).autoPromptMessage({ base: config.messages.rrMessagePrompt });

      const isRrMenu = this.container.client.reactionRolesIds.has(rrMessage.id);
      if (!isRrMenu) {
        await message.channel.send(config.messages.notAMenu);
        return;
      }

      let document: ReactionRoleDocument;
      if (options?.getDocument)
         document = await ReactionRoles.findOne({ messageId: rrMessage.id });

      Reflect.apply(originalMethod, this, [message, args, { document, rrMessage }]);
    };

    return descriptor;
  };
}
