import { ApplyOptions } from '@sapphire/decorators';
import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import pupa from 'pupa';
import { manageFaq as config } from '@/config/commands/admin';
import { Faq } from '@/models/faq';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';

const faqContentTextInput = new TextInputBuilder()
  .setStyle(TextInputStyle.Paragraph)
  .setCustomId('content')
  .setLabel(config.messages.modals.contentLabel)
  .setMinLength(1)
  .setMaxLength(2000)
  .setPlaceholder(config.messages.modals.contentPlaceholder)
  .setRequired(true);

enum Options {
  Name = 'nom',
  NewName = 'nouveau-nom',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'remove', chatInputRun: 'remove' },
    { name: 'rename', chatInputRun: 'rename' },
  ],
})
export class ManageFaqCommand extends HorizonSubcommand<typeof config> {
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
        ),
    );
  }

  public async create(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const name = interaction.options.getString(Options.Name, true);

    const contentModal = new ModalBuilder()
      .setTitle(this.messages.modals.createTitle)
      .setComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(faqContentTextInput))
      .setCustomId('create-faq-modal');

    await interaction.showModal(contentModal);
    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'create-faq-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    await Faq.create({
      name,
      content: submit.fields.getTextInputValue('content'),
      guildId: interaction.guild.id,
    });
    await submit.reply(this.messages.createdEntry);
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction<'cached'>): Promise<void> {
    const faq = await Faq.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!faq) {
      await interaction.reply({ content: this.messages.invalidQuestion, ephemeral: true });
      return;
    }

    const contentModal = new ModalBuilder()
      .setTitle(pupa(this.messages.modals.editTitle, faq))
      .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
        faqContentTextInput.setValue(faq.content),
      ))
      .setCustomId('edit-faq-modal');

    await interaction.showModal(contentModal);
    const submit = await interaction.awaitModalSubmit({
      filter: int => int.isModalSubmit()
        && int.inCachedGuild()
        && int.customId === 'edit-faq-modal'
        && int.member.id === interaction.member.id,
      time: 900_000, // 15 minutes
    });

    faq.content = submit.fields.getTextInputValue('content');
    await faq.save();
    await submit.reply(this.messages.editedEntry);
  }

  public async rename(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const faq = await Faq.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!faq) {
      await interaction.reply({ content: this.messages.invalidQuestion, ephemeral: true });
      return;
    }

    const newName = interaction.options.getString(Options.NewName, true);
    const existing = await Faq.findOne({ name: { $regex: new RegExp(newName, 'i') }, guildId: interaction.guildId });
    if (existing) {
      await interaction.reply({ content: this.messages.invalidNewName, ephemeral: true });
      return;
    }

    faq.name = newName;
    await faq.save();

    await interaction.reply(this.messages.renamedEntry);
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const faq = await Faq.findOne({ name: interaction.options.getString(Options.Name, true) });
    if (!faq) {
      await interaction.reply({ content: this.messages.invalidQuestion, ephemeral: true });
      return;
    }

    await faq.deleteOne();
    await interaction.reply(this.messages.removedEntry);
  }
}
