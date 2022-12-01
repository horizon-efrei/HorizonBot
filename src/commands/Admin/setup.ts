import { ApplyOptions } from '@sapphire/decorators';
import { filterNullAndUndefined } from '@sapphire/utilities';
import { ChannelType } from 'discord-api-types/v10';
import type { NewsChannel, TextChannel } from 'discord.js';
import { Formatters, MessageEmbed, Permissions } from 'discord.js';
import pupa from 'pupa';
import { setup as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import Configuration from '@/models/configuration';
import PaginatedContentMessageEmbed from '@/structures/PaginatedContentMessageEmbed';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import type { ConfigEntries, ConfigurationDocument } from '@/types/database';
import { ConfigEntriesChannels, ConfigEntriesRoles } from '@/types/database';

const channelEntries = {
  [ConfigEntriesChannels.ClassAnnouncementL1]: 'Annonces L1',
  [ConfigEntriesChannels.ClassAnnouncementL2]: 'Annonces L2',
  [ConfigEntriesChannels.ClassAnnouncementL3]: 'Annonces L3',
  [ConfigEntriesChannels.WeekUpcomingClasses]: 'Cours de la semaine',
  [ConfigEntriesChannels.Logs]: 'Logs',
} as const;

const roleEntries = {
  [ConfigEntriesRoles.Staff]: 'Staff',
  [ConfigEntriesRoles.Eprof]: 'eProf',
  [ConfigEntriesRoles.SchoolYearL1]: 'Role L1',
  [ConfigEntriesRoles.SchoolYearL2]: 'Role L2',
  [ConfigEntriesRoles.SchoolYearL3]: 'Role L3',
} as const;

const allEntries = {
  ...channelEntries,
  ...roleEntries,
} as const;

const channelChoices = Object.entries(channelEntries).map(([value, name]) => ({ name, value }));
const roleChoices = Object.entries(roleEntries).map(([value, name]) => ({ name, value }));

const allChoices = [
  ...channelChoices.map(({ name, value }) => ({ name: `Salon : ${name}`, value })),
  ...roleChoices.map(({ name, value }) => ({ name: `Rôle : ${name}`, value })),
];

const allowedChannels = [ChannelType.GuildNews, ChannelType.GuildText] as const;
type AllowedChannels = NewsChannel | TextChannel;

enum Options {
  Name = 'nom',
  Channel = 'salon',
  Role = 'role',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'set-channel', chatInputRun: 'setChannel' },
    { name: 'set-role', chatInputRun: 'setRole' },
    { name: 'list', chatInputRun: 'list' },
    { name: 'remove', chatInputRun: 'remove' },
    { name: 'see', chatInputRun: 'see' },
  ],
})
export default class SetupCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD)
        .addSubcommand(
          subcommand => subcommand
            .setName('set-channel')
            .setDescription(this.descriptions.subcommands.setChannel)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setChoices(...channelChoices),
            )
            .addChannelOption(
              option => option
                .setName(Options.Channel)
                .setDescription(this.descriptions.options.channel)
                .setRequired(true)
                .addChannelTypes(...allowedChannels),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('set-role')
            .setDescription(this.descriptions.subcommands.setRole)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setChoices(...roleChoices),
            )
            .addRoleOption(
              option => option
                .setName(Options.Role)
                .setDescription(this.descriptions.options.role)
                .setRequired(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('list')
            .setDescription(this.descriptions.subcommands.list),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('see')
            .setDescription(this.descriptions.subcommands.see)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setChoices(...allChoices),
            )
            .addChannelOption(
              option => option
                .setName(Options.Channel)
                .setDescription(this.descriptions.options.channel)
                .addChannelTypes(...allowedChannels),
            )
            .addRoleOption(
              option => option
                .setName(Options.Role)
                .setDescription(this.descriptions.options.role),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('remove')
            .setDescription(this.descriptions.subcommands.remove)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setChoices(...allChoices),
            ),
        ),
    );
  }

  public async setChannel(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const query = interaction.options.getString(Options.Name, true) as ConfigEntriesChannels;
    const channel = interaction.options.getChannel(Options.Channel, true) as AllowedChannels;

    await this.container.client.configManager.set(query, channel);

    await interaction.reply(this.messages.successfullyDefined);
  }

  public async setRole(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const query = interaction.options.getString(Options.Name, true) as ConfigEntriesRoles;
    const role = interaction.options.getRole(Options.Role, true);

    await this.container.client.configManager.set(query, role);

    await interaction.reply(this.messages.successfullyDefined);
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const query = interaction.options.getString(Options.Name, true) as ConfigEntries;

    await this.container.client.configManager.remove(query, interaction.guild);

    await interaction.reply(this.messages.successfullyUndefined);
  }

  public async see(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const query = interaction.options.getString(Options.Name) as ConfigEntries | null;
    const channel = interaction.options.getChannel(Options.Channel) as AllowedChannels | null;
    const role = interaction.options.getRole(Options.Role);

    if ([query, channel, role].filter(filterNullAndUndefined).length !== 1) {
      await interaction.reply({ content: this.messages.chooseOne, ephemeral: true });
      return;
    }

    if (channel || role) {
      const entries = await Configuration.find({ guildId: interaction.guild.id, value: (channel ?? role)!.id });
      await interaction.reply(entries.length > 0
        ? pupa(this.messages.associatedKeys, { keys: entries.map(e => allEntries[e.name]).join(' `, `') })
        : this.messages.noAssociatedKey);
      return;
    }

    const entry = await Configuration.findOne({ guildId: interaction.guild.id, name: query });
    await interaction.reply(entry
      ? {
          embeds: [new MessageEmbed()
            .setColor(settings.colors.transparent)
            .setDescription(
              pupa(this.messages.associatedValue, { value: this._getMention(entry.name, entry.value) }),
            )],
        }
      : this.messages.noAssociatedValue);
  }

  public async list(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const definedEntries = await Configuration.find({ guildId: interaction.guildId });

    const allEntriesFilled = new Map<ConfigEntries, { name: string; document: ConfigurationDocument | undefined }>();
    for (const [entry, name] of Object.entries(allEntries))
      allEntriesFilled.set(entry as ConfigEntries, { name, document: definedEntries.find(e => e.name === entry) });

    await new PaginatedContentMessageEmbed()
      .setTemplate(new MessageEmbed().setTitle(this.messages.listTitle).setColor(settings.colors.default))
      .setItems([...allEntriesFilled.entries()]
        .map(([entry, { name, document }]) => pupa(
          document ? this.messages.lineWithValue : this.messages.lineWithoutValue,
          { name, value: document ? this._getMention(entry, document.value) : null },
        )))
      .setItemsPerPage(15)
      .make()
      .run(interaction);
  }

  private _getMention(entry: ConfigEntries, value: string): string {
    return entry.startsWith('channel') ? Formatters.channelMention(value) : Formatters.roleMention(value);
  }
}
