import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { recordings as config } from '@/config/commands/general';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { EclassPopulatedDocument } from '@/types/database';

@ApplyOptions<HorizonCommand.Options>(config)
export default class RecordingsCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command),
      { guildIds: settings.mainGuildIds },
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const classes: EclassPopulatedDocument[] = await Eclass.find({ recordLinks: { $not: { $size: 0 } } });
    if (classes.length === 0) {
      await interaction.reply(this.messages.noRecords);
      return;
    }

    const groups = groupBy(classes, val => val.subject.name);
    const fields = Object.entries(groups)
      .map(([name, value]) => ({
        name,
        value: value.map(eclass => pupa(this.messages.listLine, {
          ...eclass.toJSON(),
          ...eclass.normalizeDates(),
          links: eclass.recordLinks.map((link, i) => pupa(this.messages.listLineLink, { num: i + 1, link })).join(' '),
        })).join('\n'),
      }))
      .slice(0, 25);

    const paginator = new PaginatedMessage({ template: new MessageEmbed().setColor(settings.colors.default) })
      .setWrongUserInteractionReply(user => ({
        content: pupa(messages.errors.wrongUserInteractionReply, { user }),
        ephemeral: true,
        allowedMentions: { users: [], roles: [] },
      }))
      .setSelectMenuOptions(index => ({
        label: Object.keys(groups)[index - 1],
        description: pupa(this.messages.pageDescription, { total: Object.values(groups)[index - 1].length }),
        emoji: Object.values(groups)[index - 1][0].subject.emoji,
      }));

    const selectMenuAction = PaginatedMessage.defaultActions
      .find(action => 'customId' in action && action.customId === '@sapphire/paginated-messages.goToPage');
    paginator.setActions(selectMenuAction ? [selectMenuAction] : []);

    for (const { name, value } of fields)
      paginator.addPageEmbed(embed => embed.setTitle(name).setDescription(value));

    await paginator.run(interaction);
  }
}
