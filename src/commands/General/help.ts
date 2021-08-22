import path from 'path';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, Command, CommandOptions } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { help as config } from '@/config/commands/general';
import settings from '@/config/settings';
import MonkaCommand from '@/structures/MonkaCommand';
import type MonkaCommandStore from '@/structures/MonkaCommandStore';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class HelpCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const requestedCommand = await args.pickResult('command');
    const embed = new MessageEmbed().setColor(settings.colors.default);

    if (requestedCommand.success) {
      const command = requestedCommand.value;
      const information = config.messages.commandInfo;
      embed.setTitle(pupa(information.title, { command }))
        .addField(information.usage, `\`${settings.prefix}${command.usage}\``)
        .addField(
          information.description,
          pupa(command.description, { prefix: settings.prefix }),
        );

      if (command.aliases.length > 1)
        embed.addField(information.aliases, `\`${command.aliases.join('`, `')}\``);
      if (command.examples.length > 0)
        embed.addField(information.examples, `\`${command.examples.join('`\n`')}\``);
    } else {
      const information = config.messages.commandsList;
      const amount = this.context.stores.get('commands').size;

      embed.setTitle(pupa(information.title, { amount }))
        .setDescription(pupa(information.description, { helpCommand: `${settings.prefix}help <commande>` }));

      const categories = (this.context.stores
        .get('commands') as MonkaCommandStore)
        // eslint-disable-next-line unicorn/prefer-object-from-entries
        .reduce<Record<string, Command[]>>((acc, val: Command) => {
          const category = this._resolveCategory(val);
          if (acc[category])
            acc[category].push(val);
          else
            acc[category] = [val];
          return acc;
        }, {});

      for (const [category, commands] of Object.entries(categories)) {
        embed.addField(
          pupa(information.category, { categoryName: category }),
          `\`${commands.map(cmd => cmd.name).join('`, `')}\``,
        );
      }
    }

    await message.channel.send({ embeds: [embed] });
  }

  private _resolveCategory(command: Command): string {
    const paths = command.path.split(path.sep);
    return paths.slice(paths.indexOf('commands') + 1, -1)[0];
  }
}
