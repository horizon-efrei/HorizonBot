import { ApplyOptions } from '@sapphire/decorators';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import pupa from 'pupa';
import { logs as config } from '@/config/commands/admin';
import { messages } from '@/config/messages';
import { LogStatuses } from '@/models/logStatuses';
import { PaginatedContentMessageEmbed } from '@/structures/PaginatedContentMessageEmbed';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import type { LogStatuses as LogStatusesEnum } from '@/types/database';
import { DiscordLogType } from '@/types/database';

const logNameChoices = Object.entries(messages.logs.simplifiedReadableEvents)
  .map(([value, name]) => ({ name, value }));
const logStatusChoices = Object.entries(messages.logs.readableStatuses)
  .map(([value, name]) => ({ name, value: Number(value) }));

enum Options {
  LogType = 'log-type',
  LogStatus = 'log-statut',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'list', chatInputRun: 'list' },
  ],
})
export class LogsCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.LogType)
                .setDescription(this.descriptions.options.logName)
                .setChoices(...logNameChoices, { name: 'Tous', value: 'all' })
                .setRequired(true),
            )
            .addIntegerOption(
              option => option
                .setName(Options.LogStatus)
                .setDescription(this.descriptions.options.logStatus)
                .setChoices(...logStatusChoices)
                .setRequired(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('list')
            .setDescription(this.descriptions.subcommands.list),
        ),
    );
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const logType = interaction.options.getString(Options.LogType, true) as DiscordLogType | 'all';
    const logStatus = interaction.options.getInteger(Options.LogStatus, true) as LogStatusesEnum;

    const guildId = interaction.guild.id;
    const guildLogs = this.container.caches.logStatuses.get(guildId)!;

    if (logType === 'all') {
      await LogStatuses.updateMany({ guildId }, { status: logStatus });
      for (const type of Object.values(DiscordLogType))
        guildLogs.set(type, logStatus);

      await interaction.reply(
        pupa(this.messages.updatedAllLog, { status: messages.logs.readableStatuses[logStatus] }),
      );
      return;
    }

    await LogStatuses.updateOne({ type: logType, guildId }, { status: logStatus });
    guildLogs.set(logType, logStatus);

    await interaction.reply(
      pupa(this.messages.updatedLog, {
        type: messages.logs.simplifiedReadableEvents[logType],
        status: this.messages.statuses[logStatus],
      }),
    );
  }

  public async list(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const logs = await LogStatuses.find({ guildId: interaction.guildId });

    await new PaginatedContentMessageEmbed()
      .setTemplate(new EmbedBuilder().setTitle(this.messages.listTitle))
      .setItems(logs.map(log => pupa(this.messages.lineValue, {
        type: messages.logs.simplifiedReadableEvents[log.type],
        status: this.messages.statuses[log.status],
      })))
      .setItemsPerPage(10)
      .make()
      .run(interaction);
  }
}
