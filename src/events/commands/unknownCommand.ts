import type { Events, UnknownCommandPayload } from '@sapphire/framework';
import { Event } from '@sapphire/framework';
import Tags from '@/models/tags';

export default class UnknownCommandEvent extends Event<Events.UnknownCommand> {
  public async run({ message, commandName }: UnknownCommandPayload): Promise<void> {
    if (!message.guild)
      return;

    const tags = await Tags.find();
    const name = commandName.toLowerCase();
    const tag = tags.find(t => t.name.toLowerCase() === name
      || t.aliases.map(alias => alias.toLowerCase()).includes(name));
    if (tag)
      await message.channel.send(tag.content);
  }
}
