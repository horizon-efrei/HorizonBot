import { ApplyOptions } from '@sapphire/decorators';
import { isDMChannel } from '@sapphire/discord.js-utilities';
import type { Args, CommandOptions } from '@sapphire/framework';
import { ok } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { help as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import { inlineCodeList, isGuildMessage } from '@/utils';

@ApplyOptions<CommandOptions>(config.options)
export default class HelpCommand extends HorizonCommand {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const command = (await args.pickResult('command'))?.value;
    const embed = new MessageEmbed().setColor(settings.colors.default);

    if (command) {
      const information = config.messages.commandInfo;
      embed.setTitle(pupa(information.title, { command }))
        .setDescription(pupa(command.description, { prefix: settings.prefix }))
        .addFields({ name: information.usage, value: `\`${settings.prefix}${command.usage}\`` });

      if (command.aliases.length > 1)
        embed.addFields({ name: information.aliases, value: inlineCodeList(command.aliases) });
      if (command.examples.length > 0)
        embed.addFields({ name: information.examples, value: inlineCodeList(command.examples, '\n\n') });
    } else {
      const information = config.messages.commandsList;
      const amount = this.container.stores.get('commands').size;

      embed.setTitle(pupa(information.title, { amount }))
        .setDescription(pupa(information.description, { helpCommand: `${settings.prefix}help <commande>` }));

      const categories = await this._getPossibleCategories(message);

      for (const [category, commands] of Object.entries(categories)) {
        embed.addFields({
          name: pupa(information.category, { categoryName: category }),
          value: inlineCodeList(commands.map(cmd => cmd.name)),
        });
      }

      if (isGuildMessage(message)) {
        const tags = this.container.client.tags.filter(tag => tag.guildId === message.guild.id);
        if (tags.size > 0) {
          embed.addFields({
            name: pupa(information.category, { categoryName: config.messages.tagsCategory }),
            value: inlineCodeList([...tags.map(tag => tag.name)]),
          });
        }
      }
    }

    await message.channel.send({ embeds: [embed] });
  }

  private async _getPossibleCategories(message: Message): Promise<Record<string, HorizonCommand[]>> {
    const originalCommands = this.container.stores.get('commands');
    const commands: HorizonCommand[] = [];

    for (const command of originalCommands.values()) {
      const result = isDMChannel(message.channel) ? ok() : await command.preconditions.run(message, command);
      if (result.success)
        commands.push(command as HorizonCommand);
    }

    return groupBy(commands, command => command.location.directories.shift());
  }
}
