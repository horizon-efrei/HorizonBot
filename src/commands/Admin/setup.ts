import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { setup as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Configuration from '@/models/configuration';
import MonkaSubCommand from '@/structures/commands/MonkaSubCommand';
import type { GuildMessage } from '@/types';
import type { ConfigurationDocument } from '@/types/database';
import { ConfigEntries } from '@/types/database';
import { generateSubcommands } from '@/utils';

const argNames = [{
  possibilities: ['moderator', 'moderators', 'moderateur', 'moderateurs', 'modo', 'modos', 'mod', 'mods'],
  entry: ConfigEntries.ModeratorFeedback,
}, {
  possibilities: ['class-l1', 'eclass-l1', 'classe-l1', 'eclasse-l1', 'cours-l1', 'ecours-l1'],
  entry: ConfigEntries.ClassAnnouncementL1,
}, {
  possibilities: ['class-l2', 'eclass-l2', 'classe-l2', 'eclasse-l2', 'cours-l2', 'ecours-l2'],
  entry: ConfigEntries.ClassAnnouncementL2,
}, {
  possibilities: ['class-l3', 'eclass-l3', 'classe-l3', 'eclasse-l3', 'cours-l3', 'ecours-l3'],
  entry: ConfigEntries.ClassAnnouncementL3,
}, {
  possibilities: ['class-general', 'eclass-general', 'classe-general', 'eclasse-general', 'cours-general', 'ecours-general'],
  entry: ConfigEntries.ClassAnnouncementGeneral,
}, {
  possibilities: ['week-class', 'week-classes', 'week-upcoming-class', 'week-upcoming-classes'],
  entry: ConfigEntries.WeekUpcomingClasses,
}, {
  possibilities: ['calendrier-l1', 'calendar-l1', 'cal-l1'],
  entry: ConfigEntries.ClassCalendarL1,
}, {
  possibilities: ['calendrier-l2', 'calendar-l2', 'cal-l2'],
  entry: ConfigEntries.ClassCalendarL2,
}, {
  possibilities: ['calendrier-l3', 'calendar-l3', 'cal-l3'],
  entry: ConfigEntries.ClassCalendarL3,
}];

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  subCommands: generateSubcommands({
    define: { aliases: ['set', 'create', 'add'] },
    see: { aliases: ['get', 'info'] },
    list: { aliases: ['liste', 'show'] },
    remove: { aliases: ['delete', 'rm', 'rem', 'del'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class SetupCommand extends MonkaSubCommand {
  public async define(message: GuildMessage, args: Args): Promise<void> {
    const query = await args.pickResult('string');
    const matchArg = argNames.find(argName => argName.possibilities.includes(query.value));

    if (matchArg) {
      const channel = (await args.pickResult('guildTextBasedChannel'))?.value || message.channel;
      await this.container.client.configManager.set(matchArg.entry, channel);
      await message.channel.send(config.messages.successfullyDefined);
    } else {
      await message.channel.send(config.messages.unknown);
    }
  }

  public async remove(message: GuildMessage, args: Args): Promise<void> {
    const query = await args.pickResult('string');
    const matchArg = argNames.find(argName => argName.possibilities.includes(query.value));

    if (matchArg) {
      await this.container.client.configManager.remove(matchArg.entry, message.guild);
      await message.channel.send(config.messages.successfullyUndefined);
    } else {
      await message.channel.send(config.messages.unknown);
    }
  }

  public async see(message: GuildMessage, args: Args): Promise<void> {
    const queryChannel = await args.pickResult('guildTextBasedChannel');
    const queryString = await args.pickResult('string');

    if (queryChannel.success || queryString.error) {
      const targetChannel = queryChannel.value ?? message.channel;
      // TODO: Improve configurationManager so we don't need to bypass it here
      const entry = await Configuration.find({ guild: targetChannel.guild.id, value: targetChannel.id });
      await message.channel.send(entry
        ? pupa(config.messages.associatedKeys, { keys: entry.map(e => e.name).join(' `, `') })
        : config.messages.noAssociatedKey);
    } else {
      const matchArg = argNames.find(argName => argName.possibilities.includes(queryString.value));
      if (!matchArg) {
        await message.channel.send(config.messages.unknown);
        return;
      }
      const entry = await Configuration.findOne({ guild: message.guild.id, name: matchArg.entry });
      await message.channel.send(entry
        ? pupa(config.messages.associatedValue, entry)
        : config.messages.noAssociatedValue);
    }
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const definedEntries = await Configuration.find({ guild: message.guild.id });
    const allEntries = argNames.map(arg => arg.entry);
    const allEntriesFilled: Array<[key: ConfigEntries, v: ConfigurationDocument]> = allEntries
      .map(entry => [entry, definedEntries.find(e => e.name === entry)]);

    await new PaginatedFieldMessageEmbed<{ name: ConfigEntries; value: string }>()
      .setTitleField(config.messages.listTitle)
      .setTemplate(new MessageEmbed().setColor(settings.colors.default))
      .setItems(allEntriesFilled.map(([key, entry]) => ({ name: key, value: entry?.value })))
      .formatItems(item => pupa(item.value ? config.messages.lineWithValue : config.messages.lineWithoutValue, item))
      .setItemsPerPage(10)
      .make()
      .run(message);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
