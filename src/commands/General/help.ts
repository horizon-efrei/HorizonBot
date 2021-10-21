import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { help as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { inlineCodeList } from '@/utils';

@ApplyOptions<CommandOptions>(config.options)
export default class HelpCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const command = (await args.pickResult('command'))?.value;
    const embed = new MessageEmbed().setColor(settings.colors.default);

    if (command) {
      const information = config.messages.commandInfo;
      embed.setTitle(pupa(information.title, { command }))
        .addField(information.usage, `\`${settings.prefix}${command.usage}\``)
        .addField(
          information.description,
          pupa(command.description, { prefix: settings.prefix }),
        );

      if (command.aliases.length > 1)
        embed.addField(information.aliases, inlineCodeList(command.aliases));
      if (command.examples.length > 0)
        embed.addField(information.examples, inlineCodeList(command.examples, '\n'));
    } else {
      const information = config.messages.commandsList;
      const amount = this.container.stores.get('commands').size;

      embed.setTitle(pupa(information.title, { amount }))
        .setDescription(pupa(information.description, { helpCommand: `${settings.prefix}help <commande>` }));

      const categories = await this._getPossibleCategories(message);

      for (const [category, commands] of Object.entries(categories)) {
        embed.addField(
          pupa(information.category, { categoryName: category }),
          inlineCodeList(commands.map(cmd => cmd.name)),
        );
      }
    }

    await message.channel.send({ embeds: [embed] });
  }

  private async _getPossibleCategories(message: GuildMessage): Promise<Record<string, HorizonCommand[]>> {
    const originalCommands = this.container.stores.get('commands');
    const commands: HorizonCommand[] = [];

    for (const command of originalCommands.values()) {
      const result = await command.preconditions.run(message, command);
      if (result.success)
        commands.push(command as HorizonCommand);
    }

    return groupBy(commands, command => command.location.directories.shift());
  }
}
