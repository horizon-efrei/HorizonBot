/**
 * @credits Some parts of this command are taken from the Prune command , appearing in the Skyra project bot.
 * https://github.com/skyra-project/skyra/blob/v7/projects/bot/src/commands/Moderation/prune.ts
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplyOptions } from '@sapphire/decorators';
import { Result } from '@sapphire/framework';
import { PermissionsBitField, RESTJSONErrorCodes } from 'discord.js';
import pupa from 'pupa';
import { purge as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { andMix } from '@/utils';

enum Options {
  Amount = 'nombre',
  Includes = 'contient',
  WithFiles = 'avec-fichiers',
  WithLinks = 'avec-liens',
  WithInvites = 'avec-invitations',
  FromMe = 'de-moi',
  FromBots = 'par-des-bots',
  FromHumans = 'par-des-humains',
  FromUser = 'utilisateur',
}

const anyUrlRegex = /ht{2}ps?:\/{2}[\w-]{2,}\.[\w-]{2,}/i;

@ApplyOptions<HorizonCommand.Options>(config)
export default class PurgeCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addIntegerOption(
          option => option
            .setName(Options.Amount)
            .setDescription(this.descriptions.options.amount).setMinValue(1),
        )
        .addUserOption(
          option => option
            .setName(Options.FromUser)
            .setDescription(this.descriptions.options.fromUser),
        )
        .addStringOption(
          option => option
            .setName(Options.Includes)
            .setDescription(this.descriptions.options.includes),
        )
        .addBooleanOption(
          option => option
            .setName(Options.WithFiles)
            .setDescription(this.descriptions.options.withFiles),
        )
        .addBooleanOption(
          option => option
            .setName(Options.WithLinks)
            .setDescription(this.descriptions.options.withLinks),
        )
        .addBooleanOption(
          option => option
            .setName(Options.WithInvites)
            .setDescription(this.descriptions.options.withInvites),
        )
        .addBooleanOption(
          option => option
            .setName(Options.FromMe)
            .setDescription(this.descriptions.options.fromMe),
        )
        .addBooleanOption(
          option => option
            .setName(Options.FromBots)
            .setDescription(this.descriptions.options.fromBot),
        )
        .addBooleanOption(
          option => option
            .setName(Options.FromHumans)
            .setDescription(this.descriptions.options.fromHuman),
        ),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    const response = await interaction.deferReply({ fetchReply: true });

    // #region Filters
    const filters = [
      (message: GuildMessage): boolean => message.deletable && message.id !== response.id,
    ];

    const amount = interaction.options.getInteger(Options.Amount) ?? 100;
    const includes = interaction.options.getString(Options.Includes);
    const withFiles = interaction.options.getBoolean(Options.WithFiles);
    const withLinks = interaction.options.getBoolean(Options.WithLinks);
    const withInvites = interaction.options.getBoolean(Options.WithInvites);
    const fromMe = interaction.options.getBoolean(Options.FromMe);
    const fromBots = interaction.options.getBoolean(Options.FromBots);
    const fromHumans = interaction.options.getBoolean(Options.FromHumans);
    const fromUser = interaction.options.getUser(Options.FromUser);

    if (includes)
      filters.push((message: GuildMessage) => message.content.includes(includes));
    if (withFiles)
      filters.push((message: GuildMessage) => message.attachments.size > 0);
    if (withLinks)
      filters.push((message: GuildMessage) => settings.configuration.discordInviteLinkRegex.test(message.content));
    if (withInvites)
      filters.push((message: GuildMessage) => anyUrlRegex.test(message.content));
    if (fromMe) {
      const meId = await interaction.guild.members.fetchMe().then(me => me.id);
      filters.push((message: GuildMessage) => message.author.id === meId);
    }
    if (fromBots)
      filters.push((message: GuildMessage) => message.author.bot);
    if (fromHumans)
      filters.push((message: GuildMessage) => !message.author.bot);
    if (fromUser)
      filters.push((message: GuildMessage) => message.author.id === fromUser.id);
    // #endregion

    const messages = (await interaction.channel!.messages.fetch({ limit: 100 }));

    // Filter the messages by their age
    const filtered = messages.filter(andMix(...filters));
    if (filtered.size === 0) {
      await interaction.followUp(this.messages.noMatchFound);
      return;
    }

    // Perform a bulk delete, throw if it returns unknown message.
    const filteredIds = [...filtered.keys()].slice(0, amount);
    const result = await interaction.channel!.bulkDelete(filteredIds)
      .then(() => Result.ok())
      .catch((error) => {
        if (error.code === RESTJSONErrorCodes.OneOfTheMessagesProvidedWasTooOldForBulkDelete)
          return Result.err(error.code as RESTJSONErrorCodes.OneOfTheMessagesProvidedWasTooOldForBulkDelete);
        if (error.code === RESTJSONErrorCodes.UnknownMessage)
          return Result.ok();
        throw error;
      });

    if (result.isErr()) {
      await interaction.followUp(this.messages.errors[result.unwrapErr()]);
      return;
    }

    await interaction.followUp(
      pupa(
        filteredIds.length === 1 ? this.messages.singularSuccess : this.messages.pluralSuccess,
        { total: filteredIds.length },
      ),
    );

    // Delete the response after 5 seconds
    setTimeout(async () => interaction.deleteReply(), 5000);
  }
}
