import type { Args } from '@sapphire/framework';
import { tags as config } from '@/config/commands/admin';
import Tags from '@/models/tags';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage } from '@/types';

export default function ResolveTagArgument(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args): Promise<void> {
      const targetName = (await args.pickResult('string')).value
        || (await new ArgumentPrompter(message).promptText(config.messages.prompts.name)).split(' ').shift();

      const tag = await Tags.findOne({ name: targetName.toLowerCase(), guildId: message.guild.id });
      if (!tag) {
        await message.channel.send(config.messages.invalidTag);
        return;
      }

      Reflect.apply(originalMethod, this, [message, args, tag]);
    };

    return descriptor;
  };
}
