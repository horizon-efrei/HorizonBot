import { ApplyOptions } from '@sapphire/decorators';
import { filterNullAndUndefinedAndEmpty } from '@sapphire/utilities';
import { DMChannel, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { reminders as config } from '@/config/commands/general';
import Reminders from '@/models/reminders';
import * as CustomResolvers from '@/resolvers';
import PaginatedContentMessageEmbed from '@/structures/PaginatedContentMessageEmbed';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';

enum Options {
  DateOrDuration = 'date-or-duration',
  Content = 'content',
  Id = 'id',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'list', chatInputRun: 'list' },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'remove', chatInputRun: 'remove' },
  ],
})
export default class RemindersCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(true)
        .addSubcommand(
          subcommand => subcommand
            .setName('create')
            .setDescription(this.descriptions.subcommands.create)
            .addStringOption(
              option => option
                .setName(Options.DateOrDuration)
                .setDescription(this.descriptions.options.dateOrDuration)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Content)
                .setDescription(this.descriptions.options.content)
                .setRequired(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.DateOrDuration)
                .setDescription(this.descriptions.options.dateOrDuration),
            )
            .addStringOption(
              option => option
                .setName(Options.Content)
                .setDescription(this.descriptions.options.content),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('remove')
            .setDescription(this.descriptions.subcommands.remove)
            .addStringOption(
              option => option
                .setName(Options.Id)
                .setDescription(this.descriptions.options.id)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('list')
            .setDescription(this.descriptions.subcommands.list),
        ),
    );
  }

  public async create(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const dateOrDuration = interaction.options.getString(Options.DateOrDuration, true);

    const date = this._parseTime(dateOrDuration);
    if (!date) {
      await interaction.reply({ content: this.messages.invalidTime, ephemeral: true });
      return;
    }

    const reminder = await Reminders.create({
      date,
      description: interaction.options.getString(Options.Content, true),
      userId: interaction.user.id,
    });

    const hasDmOpened = (await interaction.user.createDM()) instanceof DMChannel;
    await interaction.reply({
      content: [
        pupa(this.messages.createdReminder, { ...reminder.toJSON(), ...reminder.normalizeDates() }),
        hasDmOpened ? '' : this.messages.openDm,
      ].filter(filterNullAndUndefinedAndEmpty).join('\n'),
      ephemeral: true,
    });
  }

  public async list(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const reminders = this.container.client.reminders.filter(rmd => rmd.userId === interaction.user.id);
    if (!reminders || reminders.size === 0) {
      await interaction.reply({ content: this.messages.noReminders, ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    await new PaginatedContentMessageEmbed()
      .setTemplate(new MessageEmbed().setTitle(pupa(this.messages.listTitle, { total: reminders.size })))
      .setItems([
        ...reminders.map(reminder => pupa(this.messages.listLine, {
          ...reminder.toJSON(),
          timestamp: Math.round(reminder.date / 1000),
        })),
      ])
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const targetId = interaction.options.getString(Options.Id, true);
    const reminder = await Reminders.findOne({ reminderId: targetId, userId: interaction.user.id });
    if (!reminder) {
      await interaction.reply({ content: this.messages.invalidReminder, ephemeral: true });
      return;
    }

    const dateOrDuration = interaction.options.getString(Options.DateOrDuration);
    const content = interaction.options.getString(Options.Content);
    if (!dateOrDuration && !content) {
      await interaction.reply({ content: this.messages.invalidUsage, ephemeral: true });
      return;
    }

    if (dateOrDuration) {
      const date = this._parseTime(dateOrDuration);
      if (date) {
        reminder.date = date;
      } else {
        await interaction.reply({ content: this.messages.invalidTime, ephemeral: true });
        return;
      }
    }

    if (content)
      reminder.description = content;

    await reminder.save();

    await interaction.reply({
      content: pupa(this.messages.editedReminder, { ...reminder.toJSON(), ...reminder.normalizeDates() }),
      ephemeral: true,
    });
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const targetId = interaction.options.getString(Options.Id, true);
    const reminder = await Reminders.findOne({ reminderId: targetId, userId: interaction.user.id });
    if (!reminder) {
      await interaction.reply({ content: this.messages.invalidReminder, ephemeral: true });
      return;
    }

    await reminder.remove();
    await interaction.reply({ content: this.messages.removedReminder, ephemeral: true });
  }

  private _parseTime(dateOrDuration: string): number | null {
    return CustomResolvers.resolveDuration(dateOrDuration)
      .mapOr(
        CustomResolvers.resolveDate(dateOrDuration).mapOr(null, dat => dat.getTime()),
        duration => Date.now() + duration,
      );
  }
}
