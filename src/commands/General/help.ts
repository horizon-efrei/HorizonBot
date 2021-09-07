import path from 'path';
import { ApplyOptions } from '@sapphire/decorators';
import type {
  Args,
  CommandOptions,
  PreconditionContainerSingle,
  Result,
  UserError,
} from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { help as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type HorizonCommandStore from '@/structures/commands/HorizonCommandStore';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class HelpCommand extends HorizonCommand {
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
      const amount = this.container.stores.get('commands').size;

      embed.setTitle(pupa(information.title, { amount }))
        .setDescription(pupa(information.description, { helpCommand: `${settings.prefix}help <commande>` }));

      const categories = await this._getCategories(message);

      for (const [category, commands] of Object.entries(categories)) {
        embed.addField(
          pupa(information.category, { categoryName: category }),
          `\`${commands.map(cmd => cmd.name).join('`, `')}\``,
        );
      }
    }

    await message.channel.send({ embeds: [embed] });
  }

  private async _getCategories(message: GuildMessage): Promise<Record<string, HorizonCommand[]>> {
    const originalCommands = (this.container.stores.get('commands') as HorizonCommandStore);
    const commands = [];

    for (const command of originalCommands.values()) {
      const preconditions = command.preconditions.entries.map(
        (precondition: PreconditionContainerSingle) => precondition.run(message, command, precondition.context),
      ) as Array<Result<unknown, UserError>>;

      const results = await Promise.allSettled(preconditions);
      if (results.every(result => result.status === 'fulfilled' && result.value.success))
        commands.push(command);
    }

    return groupBy(commands, command => this._resolveCategory(command));
  }

  private _resolveCategory(command: HorizonCommand): string {
    const paths = command.path.split(path.sep);
    return paths.slice(paths.indexOf('commands') + 1, -1)[0];
  }
}
