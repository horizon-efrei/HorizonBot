import type { Events, UnknownCommandPayload } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import settings from '@/config/settings';
import Tags from '@/models/tags';

export default class UnknownCommandListener extends Listener<typeof Events.UnknownCommand> {
  public async run({ message, commandName }: UnknownCommandPayload): Promise<void> {
    if (!message.guild)
      return;

    const tags = await Tags.find();
    const name = commandName.toLowerCase();
    const tag = tags.find(t => t.name.toLowerCase() === name
      || t.aliases.map(alias => alias.toLowerCase()).includes(name));
    if (tag) {
      if (tag.isEmbed) {
        const embed = new MessageEmbed()
          .setColor(settings.colors.default)
          .setDescription(tag.content)
          .setTimestamp();
        await message.channel.send({ embeds: [embed] });
      } else {
        await message.channel.send(tag.content);
      }
      tag.uses++;
      await tag.save();
    }
  }
}
