import { ApplyOptions } from '@sapphire/decorators';
import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import pupa from 'pupa';
import { manageTags as config } from '@/config/commands/admin';
import { Tag } from '@/models/tags';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';

const inOrWithout = (inEmbed: boolean): string => config.messages[inEmbed ? 'inEmbed' : 'withoutEmbed'];

const tagContentComponents = new ActionRowBuilder<TextInputBuilder>().addComponents(
  new TextInputBuilder()
    .setStyle(TextInputStyle.Paragraph)
    .setCustomId('content')
    .setLabel(config.messages.modals.contentLabel)
    .setMinLength(1)
    .setMaxLength(2000)
    .setPlaceholder(config.messages.modals.contentPlaceholder)
    .setRequired(true),
);

enum Options {
  Name = 'nom',
  InEmbed = 'dans-embed',
  NewName = 'nouveau-nom',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'remove', chatInputRun: 'remove' },
    { name: 'rename', chatInputRun: 'rename' },
    { name: 'in-embed', chatInputRun: 'inEmbed' },
  ],
})
export class ManageTagsCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand(
          subcommand => subcommand
            .setName('create')
            .setDescription(this.descriptions.subcommands.create)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true),
            )
            .addBooleanOption(
              option => option
                .setName(Options.InEmbed)
                .setDescription(this.descriptions.options.inEmbed),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('edit')
            .setDescription(this.descriptions.subcommands.edit)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setAutocomplete(true),
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
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('rename')
            .setDescription(this.descriptions.subcommands.rename)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption(
              option => option
                .setName(Options.NewName)
                .setDescription(this.descriptions.options.newName)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand(
          subcommand => subcommand
            .setName('in-embed')
            .setDescription(this.descriptions.subcommands.inEmbed)
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addBooleanOption(
              option => option
                .setName(Options.InEmbed)
                .setDescription(this.descriptions.options.inEmbed)
                .setRequired(true),
            ),
        ),
    );
  }

  public async create(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const name = interaction.options.getString(Options.Name, true);
    const isEmbed = interaction.options.getBoolean(Options.InEmbed) ?? false;

    const contentModal = new ModalBuilder()
      .setTitle(this.messages.modals.createTitle)
      .setComponents(tagContentComponents)
      .setCustomId('create-tag-modal');

    await interaction.showModal(contentModal);
    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'create-tag-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    await Tag.create({
      name,
      content: submit.fields.getTextInputValue('content'),
      isEmbed,
      guildId: interaction.guild.id,
    });
    await submit.reply(this.messages.createdTag);
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const tag = await Tag.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!tag) {
      await interaction.reply({ content: this.messages.invalidTag, ephemeral: true });
      return;
    }

    const contentModal = new ModalBuilder()
      .setTitle(pupa(this.messages.modals.editTitle, tag))
      .addComponents(tagContentComponents)
      .setCustomId('edit-tag-modal');

    await interaction.showModal(contentModal);
    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'edit-tag-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    tag.content = submit.fields.getTextInputValue('content');
    await tag.save();
    await submit.reply(this.messages.editedTag);
  }

  public async rename(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const tag = await Tag.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!tag) {
      await interaction.reply({ content: this.messages.invalidTag, ephemeral: true });
      return;
    }

    const newName = interaction.options.getString(Options.NewName, true);
    const existing = await Tag.findOne({ name: { $regex: new RegExp(newName, 'i') }, guildId: interaction.guildId });
    if (existing) {
      await interaction.reply({ content: this.messages.invalidNewName, ephemeral: true });
      return;
    }

    tag.name = newName;
    await tag.save();

    await interaction.reply(this.messages.renamedTag);
  }

  public async inEmbed(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const tag = await Tag.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!tag) {
      await interaction.reply({ content: this.messages.invalidTag, ephemeral: true });
      return;
    }

    tag.isEmbed = interaction.options.getBoolean(Options.InEmbed, true);
    await tag.save();

    await interaction.reply(pupa(this.messages.editedTagEmbed, { inOrWithout: inOrWithout(tag.isEmbed) }));
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const tag = await Tag.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!tag) {
      await interaction.reply({ content: this.messages.invalidTag, ephemeral: true });
      return;
    }

    await tag.deleteOne();
    await interaction.reply(this.messages.removedTag);
  }
}
