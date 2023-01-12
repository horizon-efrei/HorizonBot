/* eslint-disable max-lines */
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord-utilities';
import { Resolvers, Result } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { ChannelType } from 'discord-api-types/v10';
import type {
  GuildTextBasedChannel,
  InteractionReplyOptions,
  NewsChannel,
  Role,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  TextChannel,
} from 'discord.js';
import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  roleMention,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import pupa from 'pupa';
import { reactionRole as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import ReactionRole from '@/models/reactionRole';
import * as CustomResolvers from '@/resolvers';
import PaginatedMessageEmbedFields from '@/structures/PaginatedMessageEmbedFields';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';
import type { GuildMessage } from '@/types';
import type { ReactionRoleDocument } from '@/types/database';
import { nullop, trimText } from '@/utils';

enum Options {
  Channel = 'salon',
  Unique = 'unique',
  RoleCondition = 'role-condition',
  Emoji = 'emoji',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Role = 'role',
  MessageUrl = 'message-url',
  Choice = 'choix',
  Emoji1 = 'emoji1',
  Role1 = 'role1',
  Emoji2 = 'emoji2',
  Role2 = 'role2',
  Emoji3 = 'emoji3',
  Role3 = 'role3',
  Emoji4 = 'emoji4',
  Role4 = 'role4',
  Emoji5 = 'emoji5',
  Role5 = 'role5',
}

enum OptionEditChoiceChoices {
  Title = 'titre',
  Description = 'description',
  TitleAndDescription = 'titre-et-description',
}

enum OptionRoleConditionChoiceChoices {
  Add = 'ajout',
  Clear = 'tout-supprimer',
  Show = 'afficher',
}

const titleInput = new TextInputBuilder()
  .setStyle(TextInputStyle.Short)
  .setCustomId('title')
  .setLabel(config.messages.modals.titleLabel)
  .setMinLength(1)
  .setMaxLength(EmbedLimits.MaximumTitleLength)
  .setPlaceholder(config.messages.modals.titlePlaceholder);

const descriptionInput = new TextInputBuilder()
  .setStyle(TextInputStyle.Paragraph)
  .setCustomId('description')
  .setLabel(config.messages.modals.descriptionLabel)
  .setPlaceholder(config.messages.modals.descriptionPlaceholder);

const isUnique = (unique: boolean): string => config.messages[unique ? 'uniqueEnabled' : 'uniqueDisabled'];

const getEmbed = (content: string): InteractionReplyOptions => ({
  embeds: [new EmbedBuilder().setColor(settings.colors.transparent).setDescription(content)],
});

const optionPairs = [
  [Options.Emoji1, Options.Role1],
  [Options.Emoji2, Options.Role2],
  [Options.Emoji3, Options.Role3],
  [Options.Emoji4, Options.Role4],
  [Options.Emoji5, Options.Role5],
] as const;

type EmojiOptionCallback = (option: SlashCommandStringOption) => SlashCommandStringOption;
type RoleOptionCallback = (option: SlashCommandRoleOption) => SlashCommandRoleOption;

function * emojiGenerator(this: void): Generator<EmojiOptionCallback, null> {
  for (const [emoji] of optionPairs) {
    yield (option): SlashCommandStringOption => option
      .setName(emoji)
      .setDescription(config.descriptions.options.emoji)
      .setAutocomplete(true)
      .setRequired(emoji === Options.Emoji1);
  }
  return null;
}

function * roleGenerator(this: void): Generator<RoleOptionCallback, null> {
  for (const [, role] of optionPairs) {
    yield (option): SlashCommandRoleOption => option
      .setName(role)
      .setDescription(config.descriptions.options.role)
      .setRequired(role === Options.Role1);
  }
  return null;
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'list', chatInputRun: 'list', default: true },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'remove', chatInputRun: 'remove' },
    { name: 'add-pair', chatInputRun: 'addPair' },
    { name: 'remove-pair', chatInputRun: 'removePair' },
    { name: 'unique', chatInputRun: 'unique' },
    { name: 'role-condition', chatInputRun: 'roleCondition' },
  ],
})
export default class ReactionRoleCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    const multipleEmojiOptions = emojiGenerator();
    const multipleRoleOptions = roleGenerator();

    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(
          subcommand => subcommand
            .setName('create')
            .setDescription(this.descriptions.subcommands.create)
            .addChannelOption(
              option => option
                .setName(Options.Channel)
                .setDescription(this.descriptions.options.channel)
                .addChannelTypes(ChannelType.GuildNews, ChannelType.GuildText)
                .setRequired(true),
            )
            .addStringOption(multipleEmojiOptions.next().value!)
            .addRoleOption(multipleRoleOptions.next().value!)
            .addStringOption(multipleEmojiOptions.next().value!)
            .addRoleOption(multipleRoleOptions.next().value!)
            .addStringOption(multipleEmojiOptions.next().value!)
            .addRoleOption(multipleRoleOptions.next().value!)
            .addStringOption(multipleEmojiOptions.next().value!)
            .addRoleOption(multipleRoleOptions.next().value!)
            .addStringOption(multipleEmojiOptions.next().value!)
            .addRoleOption(multipleRoleOptions.next().value!)
            .addBooleanOption(
              option => option
                .setName(Options.Unique)
                .setDescription(this.descriptions.options.unique),
            )
            .addRoleOption(
              option => option
                .setName(Options.RoleCondition)
                .setDescription(this.descriptions.options.roleCondition),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('list')
            .setDescription(this.descriptions.subcommands.list),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Choice)
                .setDescription(this.descriptions.options.choice)
                .setChoices(
                  { name: 'Modifier le titre', value: OptionEditChoiceChoices.Title },
                  { name: 'Modifier la description', value: OptionEditChoiceChoices.Description },
                  { name: 'Modifier le titre et la description', value: OptionEditChoiceChoices.TitleAndDescription },
                ),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('remove')
            .setDescription(this.descriptions.subcommands.remove)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('add-pair')
            .setDescription(this.descriptions.subcommands.addPair)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Emoji)
                .setDescription(this.descriptions.options.emoji)
                .setRequired(true)
                .setAutocomplete(true),
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
            .setName('remove-pair')
            .setDescription(this.descriptions.subcommands.removePair)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
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
            .setName('unique')
            .setDescription(this.descriptions.subcommands.unique)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addBooleanOption(
              option => option
                .setName(Options.Unique)
                .setDescription(this.descriptions.options.unique),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('role-condition')
            .setDescription(this.descriptions.subcommands.roleCondition)
            .addStringOption(
              option => option
                .setName(Options.MessageUrl)
                .setDescription(this.descriptions.options.messageUrl)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Choice)
                .setDescription(this.descriptions.options.choice)
                .setChoices(
                  { name: 'Définir le rôle pré-requis', value: OptionRoleConditionChoiceChoices.Add },
                  { name: 'Supprimer le rôle pré-requis', value: OptionRoleConditionChoiceChoices.Clear },
                ),
            )
            .addRoleOption(
              option => option
                .setName(Options.Role)
                .setDescription(this.descriptions.options.role),
            ),
        ),
    );
  }

  public async create(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const uniqueRole = interaction.options.getBoolean(Options.Unique) ?? false;
    const channel = interaction.options.getChannel(Options.Channel, true) as NewsChannel | TextChannel;
    const condition = interaction.options.getRole(Options.RoleCondition);

    const pairs: Array<{ reaction: string; role: Role }> = [];

    for (const [emojiOption, roleOption] of optionPairs) {
      const emoji = interaction.options.getString(emojiOption);
      const role = interaction.options.getRole(roleOption);
      if (!emoji || !role)
        continue;

      const reaction = CustomResolvers.resolveEmoji(emoji, interaction.guild);

      if (reaction.isOk()
        && !pairs.map(r => r.reaction).includes(reaction.unwrap())
        && !pairs.map(r => r.role).includes(role))
        pairs.push({ reaction: reaction.unwrap(), role });
    }

    if (pairs.length === 0) {
      await interaction.reply({ content: this.messages.invalidEntries, ephemeral: true });
      return;
    }

    const createMenuModal = new ModalBuilder()
      .setTitle(this.messages.modals.createTitle)
      .setComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput.setRequired(true)),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      )
      .setCustomId('create-rr-modal');

    await interaction.showModal(createMenuModal);

    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'create-rr-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    await submit.deferReply();

    const title = submit.fields.getTextInputValue('title');
    const description = submit.fields.getTextInputValue('description');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description);
    const reactionRoleMessage = await channel.send({ embeds: [embed] });

    for (const rr of pairs)
      await reactionRoleMessage.react(rr.reaction);

    this.container.client.reactionRolesIds.add(reactionRoleMessage.id);
    await ReactionRole.create({
      messageId: reactionRoleMessage.id,
      channelId: reactionRoleMessage.channel.id,
      guildId: reactionRoleMessage.guildId,
      reactionRolePairs: pairs.map(({ reaction, role }) => ({ reaction, role: role.id })),
      uniqueRole,
      roleCondition: condition?.id,
    });

    await submit.followUp(pupa(this.messages.createdMenu, { title }));
  }

  public async list(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const reactionRoles = await ReactionRole.find({ guildId: interaction.guildId });
    if (!reactionRoles || reactionRoles.length === 0) {
      await interaction.reply(this.messages.noMenus);
      return;
    }

    const items: Array<{
      condition: string | null;
      title: string;
      total: number;
      unique: boolean;
      url: string;
    }> = [];
    for (const rr of reactionRoles) {
      const rrChannel = interaction.guild.channels.resolve(rr.channelId) as GuildTextBasedChannel;
      const rrMessage = await rrChannel?.messages.fetch(rr.messageId).catch(nullop);
      if (!rrMessage)
        continue;

      items.push({
        condition: rr.roleCondition,
        title: rrMessage.embeds[0].title ?? 'Titre inconnu',
        total: rr.reactionRolePairs.length,
        unique: rr.uniqueRole,
        url: rrMessage.url,
      });
    }

    const baseEmbed = new EmbedBuilder()
      .setTitle(pupa(this.messages.listTitle, { total: reactionRoles.length }))
      .setColor(settings.colors.default);

    await new PaginatedMessageEmbedFields()
      .setTemplate(baseEmbed)
      .setItems(
        items.map(rr => ({
          name: trimText(rr.title, EmbedLimits.MaximumFieldNameLength),
          value: pupa(this.messages.listFieldDescription, {
            ...rr,
            unique: rr.unique ? settings.emojis.yes : settings.emojis.no,
            condition: rr.condition ? roleMention(rr.condition) : settings.emojis.no,
          }),
        })),
      )
      .setItemsPerPage(5)
      .make()
      .run(interaction);
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { rrMessage } = metadata.unwrap();

    // We delete it, and the "messageDelete" listener will take care of the rest.
    await rrMessage.delete();
    await interaction.reply(this.messages.removedMenu);
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { rrMessage } = metadata.unwrap();

    const choice = (
      interaction.options.getString(Options.Choice) ?? OptionEditChoiceChoices.TitleAndDescription
    ) as OptionEditChoiceChoices;

    const components: Array<ActionRowBuilder<TextInputBuilder>> = [];
    if (choice === OptionEditChoiceChoices.Title || choice === OptionEditChoiceChoices.TitleAndDescription)
      components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput.setRequired(true)));
    if (choice === OptionEditChoiceChoices.Description || choice === OptionEditChoiceChoices.TitleAndDescription)
      components.push(new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput.setRequired(true)));

    const editMenuModal = new ModalBuilder()
      .setTitle(this.messages.modals.createTitle)
      .setComponents(...components)
      .setCustomId('edit-rr-modal');

    await interaction.showModal(editMenuModal);

    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'edit-rr-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    const embed = EmbedBuilder.from(rrMessage.embeds[0]);
    try {
      embed.setTitle(submit.fields.getTextInputValue('title'));
    } catch { /* Ignored */ }
    try {
      embed.setDescription(submit.fields.getTextInputValue('description'));
    } catch { /* Ignored */ }

    await rrMessage.edit({ embeds: [embed] });
    await submit.reply(this.messages.editedMenu);
  }

  public async addPair(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { rrMessage, document } = metadata.unwrap();

    const emojiQuery = interaction.options.getString('emoji', true);
    const resultReaction = CustomResolvers.resolveEmoji(emojiQuery, interaction.guild);
    if (resultReaction.isErr()) {
      await interaction.reply({ content: this.messages.invalidReaction, ephemeral: true });
      return;
    }

    const reaction = resultReaction.unwrap();
    if (document.reactionRolePairs.some(pair => pair.reaction === reaction)) {
      await interaction.reply({ content: this.messages.reactionAlreadyUsed, ephemeral: true });
      return;
    }

    const role = interaction.options.getRole('role', true);
    if (document.reactionRolePairs.some(pair => pair.role === role.id)) {
      await interaction.reply({ content: this.messages.roleAlreadyUsed, ephemeral: true });
      return;
    }

    await rrMessage.react(emojiQuery);

    document.reactionRolePairs.push({ reaction, role: role.id });
    await document.save();

    await interaction.reply(pupa(this.messages.addedPairSuccessfully, { reaction, role, rrMessage }));
  }

  public async removePair(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { rrMessage, document } = metadata.unwrap();

    const role = interaction.options.getRole('role', true);
    const pair = document.reactionRolePairs.find(rrp => rrp.role === role.id);
    if (!pair) {
      await interaction.reply({ content: this.messages.roleNotUsed, ephemeral: true });
      return;
    }

    await rrMessage.reactions.cache.get(pair.reaction)?.remove();

    document.reactionRolePairs.pull(pair);
    await document.save();
    await interaction.reply(pupa(this.messages.removedPairSuccessfully, { rrMessage }));
  }

  public async unique(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { document } = metadata.unwrap();

    const uniqueRole = interaction.options.getBoolean('unique');
    if (isNullish(uniqueRole)) {
      await interaction.reply(pupa(this.messages.uniqueMode, { uniqueMode: isUnique(document.uniqueRole) }));
      return;
    }

    document.uniqueRole = uniqueRole;
    await document.save();
    await interaction.reply(pupa(this.messages.changedUniqueMode, { uniqueMode: isUnique(document.uniqueRole) }));
  }

  public async roleCondition(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const metadata = await this._resolveMenuMetadata(interaction);
    if (metadata.isErr()) {
      await interaction.reply({ content: metadata.unwrapErr(), ephemeral: true });
      return;
    }

    const { document } = metadata.unwrap();

    const choice = (
      interaction.options.getString(Options.Choice) ?? OptionRoleConditionChoiceChoices.Show
    ) as OptionRoleConditionChoiceChoices;

    switch (choice) {
      case OptionRoleConditionChoiceChoices.Show:
        await interaction.reply(
          document.roleCondition
            ? getEmbed(pupa(this.messages.roleCondition, { role: roleMention(document.roleCondition) }))
            : this.messages.noRoleCondition,
        );
        break;
      case OptionRoleConditionChoiceChoices.Clear:
        document.roleCondition = null;
        await document.save();
        await interaction.reply(this.messages.removedRoleCondition);
        break;
      case OptionRoleConditionChoiceChoices.Add: {
        const askedRole = interaction.options.getRole('role');
        if (!askedRole) {
          await interaction.reply({ content: this.messages.noRoleProvided, ephemeral: true });
          return;
        }

        document.roleCondition = askedRole.id;
        await document.save();

        await interaction.reply(getEmbed(pupa(this.messages.changedRoleCondition, { role: askedRole })));
        break;
      }
    }
  }

  private async _resolveMenuMetadata(
    interaction: HorizonSubcommand.ChatInputInteraction,
  ): Promise<Result<{ document: ReactionRoleDocument; rrMessage: GuildMessage }, string>> {
    const resultMessage = await Resolvers.resolveMessage(
      interaction.options.getString(Options.MessageUrl, true),
      { messageOrInteraction: interaction },
    );

    if (resultMessage.isErr())
      return Result.err(this.messages.notAMenu);

    const rrMessage = resultMessage.unwrap();
    if (!rrMessage.inGuild())
      return Result.err(this.messages.notAMenu);

    const isRrMenu = this.container.client.reactionRolesIds.has(rrMessage.id);
    if (!isRrMenu)
      return Result.err(this.messages.notAMenu);

    const document = await ReactionRole.findOne({ messageId: rrMessage.id });
    if (!document)
      return Result.err(this.messages.notAMenu);

    return Result.ok({ document, rrMessage });
  }
}
