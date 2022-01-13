import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import type { EclassPopulatedDocument } from '@/app/lib/types/database';
import { records as config } from '@/config/commands/general';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import HorizonCommand from '@/structures/commands/HorizonCommand';

@ApplyOptions<CommandOptions>(config.options)
export default class PingCommand extends HorizonCommand {
  public async messageRun(message: Message): Promise<void> {
    const classes: EclassPopulatedDocument[] = await Eclass.find({ recordLink: { $ne: null } });
    if (classes.length === 0) {
      await message.channel.send(config.messages.noRecords);
      return;
    }

    const groups = groupBy(classes, val => val.subject.name);
    const fields = Object.entries(groups)
      .map(([name, value]) => ({
        name,
        value: value.map(eclass => pupa(config.messages.listLine, { ...eclass.toJSON(), ...eclass.normalizeDates() })).join('\n'),
      }))
      .slice(0, 25);

    const paginator = new PaginatedMessage({ template: new MessageEmbed().setColor(settings.colors.default) })
      .setSelectMenuOptions(index => ({
        label: Object.keys(groups)[index - 1],
        description: pupa(config.messages.pageDescription, { total: Object.values(groups)[index - 1].length }),
        emoji: Object.values(groups)[index - 1][0].subject.emoji,
      }));
    const selectMenuAction = PaginatedMessage.defaultActions.find(action => action.customId === '@sapphire/paginated-messages.goToPage');
    paginator.setActions([selectMenuAction]);

    for (const { name, value } of fields)
      paginator.addPageEmbed(embed => embed.setTitle(name).setDescription(value));

    await paginator.run(message);
  }
}
