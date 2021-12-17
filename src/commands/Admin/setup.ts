import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Formatters, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { setup as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Configuration from '@/models/configuration';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import type { GuildMessage } from '@/types';
import type { ConfigEntries, ConfigurationDocument } from '@/types/database';
import { ConfigEntriesChannels, ConfigEntriesRoles } from '@/types/database';
import { generateSubcommands, inlineCodeList } from '@/utils';

const argNames: Array<{ possibilities: string[]; type: 'channel' | 'role'; entry: ConfigEntries }> = [{
  possibilities: ['moderator', 'moderateur', 'mod'],
  type: 'channel',
  entry: ConfigEntriesChannels.ModeratorFeedback,
}, {
  possibilities: ['class-l1', 'classe-l1', 'cours-l1'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassAnnouncementL1,
}, {
  possibilities: ['class-l2', 'classe-l2', 'cours-l2'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassAnnouncementL2,
}, {
  possibilities: ['class-l3', 'classe-l3', 'cours-l3'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassAnnouncementL3,
}, {
  possibilities: ['class-general', 'classe-general', 'cours-general'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassAnnouncementGeneral,
}, {
  possibilities: ['week-class', 'week-upcoming-class', 'cours-semaine'],
  type: 'channel',
  entry: ConfigEntriesChannels.WeekUpcomingClasses,
}, {
  possibilities: ['calendrier-l1', 'calendar-l1', 'cal-l1'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassCalendarL1,
}, {
  possibilities: ['calendrier-l2', 'calendar-l2', 'cal-l2'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassCalendarL2,
}, {
  possibilities: ['calendrier-l3', 'calendar-l3', 'cal-l3'],
  type: 'channel',
  entry: ConfigEntriesChannels.ClassCalendarL3,
}, {
  possibilities: ['logs', 'log'],
  type: 'channel',
  entry: ConfigEntriesChannels.Logs,
}, {
  possibilities: ['role-staff', 'staff'],
  type: 'role',
  entry: ConfigEntriesRoles.Staff,
}, {
  possibilities: ['prof-info', 'eprof-info', 'prof-informatique', 'eprof-informatique'],
  type: 'role',
  entry: ConfigEntriesRoles.EprofComputerScience,
}, {
  possibilities: ['prof-maths', 'eprof-maths', 'prof-mathématiques', 'eprof-mathématiques'],
  type: 'role',
  entry: ConfigEntriesRoles.EprofMathematics,
}, {
  possibilities: ['prof-fg', 'eprof-fg', 'prof-formation-générale', 'eprof-formation-générale'],
  type: 'role',
  entry: ConfigEntriesRoles.EprofGeneralFormation,
}, {
  possibilities: ['prof-phy', 'eprof-phy', 'prof-physique-éléctronique', 'eprof-physique-éléctronique'],
  type: 'role',
  entry: ConfigEntriesRoles.EprofPhysicsElectronics,
}, {
  possibilities: ['prof', 'eprof', 'prof-general', 'eprof-general'],
  type: 'role',
  entry: ConfigEntriesRoles.Eprof,
}, {
  possibilities: ['role-l1', 'role-promo-l1'],
  type: 'role',
  entry: ConfigEntriesRoles.SchoolYearL1,
}, {
  possibilities: ['role-l2', 'role-promo-l2'],
  type: 'role',
  entry: ConfigEntriesRoles.SchoolYearL2,
}, {
  possibilities: ['role-l3', 'role-promo-l3'],
  type: 'role',
  entry: ConfigEntriesRoles.SchoolYearL3,
}];

const possibilitiesExamples = inlineCodeList(argNames.flatMap(argName => argName.possibilities[0]));

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  preconditions: ['GuildOnly', 'StaffOnly'],
  subCommands: generateSubcommands(['create', 'list', 'remove', 'help'], {
    see: { aliases: ['get', 'info'] },
  }),
})
export default class SetupCommand extends HorizonSubCommand {
  public async create(message: GuildMessage, args: Args): Promise<void> {
    const query = await args.pickResult('string');
    const matchArg = argNames.find(argName => argName.possibilities.includes(query.value));
    if (!matchArg) {
      await message.channel.send(pupa(config.messages.unknown, { list: possibilitiesExamples }));
      return;
    }

    if (matchArg.type === 'channel') {
      const channel = (await args.pickResult('guildTextBasedChannel'))?.value ?? message.channel;
      await this.container.client.configManager.set(matchArg.entry, channel);
    } else if (matchArg.type === 'role') {
      const role = (await args.pickResult('role'))?.value;
      if (!role) {
        await message.channel.send(config.messages.invalidRole);
        return;
      }
      await this.container.client.configManager.set(matchArg.entry, role);
    }

    await message.channel.send(config.messages.successfullyDefined);
  }

  public async remove(message: GuildMessage, args: Args): Promise<void> {
    const query = await args.pickResult('string');
    const matchArg = argNames.find(argName => argName.possibilities.includes(query.value));

    if (matchArg) {
      await this.container.client.configManager.remove(matchArg.entry, message.guild);
      await message.channel.send(config.messages.successfullyUndefined);
    } else {
      await message.channel.send(pupa(config.messages.unknown, { list: possibilitiesExamples }));
    }
  }

  public async see(message: GuildMessage, args: Args): Promise<void> {
    const queryResolved = await args.pickResult('guildTextBasedChannel').catch(async () => args.pickResult('role'));
    const queryString = await args.pickResult('string');

    if (queryResolved.success || queryString.error) {
      const targetValue = queryResolved.value ?? message.channel;
      // TODO: Improve configurationManager so we don't need to bypass it here
      const entry = await Configuration.find({ guild: message.guild.id, value: targetValue.id });
      await message.channel.send(entry
        ? pupa(config.messages.associatedKeys, { keys: entry.map(e => e.name).join(' `, `') })
        : config.messages.noAssociatedKey);
    } else {
      const matchArg = argNames.find(argName => argName.possibilities.includes(queryString.value));
      if (!matchArg) {
        await message.channel.send(pupa(config.messages.unknown, { list: possibilitiesExamples }));
        return;
      }

      const entry = await Configuration.findOne({ guild: message.guild.id, name: matchArg.entry });
      await message.channel.send(entry
        ? {
           embeds: [
              new MessageEmbed().setDescription(
                // FIXME: Hackiest code in the west (mostly the value)
                pupa(config.messages.associatedValue, { ...entry, value: this._getMention(entry) }),
              ),
            ],
          }
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
      .setTemplate(
        new MessageEmbed()
          .setColor(settings.colors.default)
          .addField(config.messages.possibilitiesTitle, possibilitiesExamples),
      )
      .setItems(allEntriesFilled.map(([name, entry]) => ({ name, value: entry?.value })))
      .formatItems(item => pupa(
        item.value ? config.messages.lineWithValue : config.messages.lineWithoutValue,
        { ...item, value: this._getMention(item) },
      ))
      .setItemsPerPage(15)
      .make()
      .run(message);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields([...config.messages.helpEmbedDescription])
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }

  private _getMention(entry: { name: ConfigEntries; value: string }): string {
    return entry.name.startsWith('channel') ? Formatters.channelMention(entry.value) : Formatters.roleMention(entry.value);
  }
}
