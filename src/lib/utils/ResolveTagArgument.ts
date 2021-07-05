/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import type { Args } from '@sapphire/framework';
import { tags as config } from '@/config/commands/admin';
import Tags from '@/models/tags';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import type { GuildMessage } from '@/types';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ResolveTagArgument() {
  return (_target: Object, _key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: GuildMessage, args: Args): Promise<void> {
      const prompter = new ArgumentPrompter(message);

      const targetName = (await args.pickResult('string')).value
        || (await prompter.promptText(config.messages.prompts.name)).split(' ').shift();

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
