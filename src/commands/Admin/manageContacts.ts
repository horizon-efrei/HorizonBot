import { ApplyOptions } from '@sapphire/decorators';
import { PermissionsBitField } from 'discord.js';
import { manageContacts as config } from '@/config/commands/admin';
import { Contact } from '@/models/contact';
import { HorizonSubcommand } from '@/structures/commands/HorizonSubcommand';

enum Options {
  Name = 'nom',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Contact = 'contact',
  Team = 'équipe',
  Description = 'description',
  Field = 'champ',
  Value = 'valeur',
}

enum OptionFieldChoices {
  Name = 'name',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Contact = 'contact',
  Team = 'team',
  Description = 'description',
}

@ApplyOptions<HorizonSubcommand.Options>({
  ...config,
  subcommands: [
    { name: 'create', chatInputRun: 'create' },
    { name: 'edit', chatInputRun: 'edit' },
    { name: 'remove', chatInputRun: 'remove' },
  ],
})
export class ManageContactsCommand extends HorizonSubcommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonSubcommand.Registry): void {
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
            .addStringOption(
              option => option
                .setName(Options.Name)
                .setDescription(this.descriptions.options.name)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Contact)
                .setDescription(this.descriptions.options.contact)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Team)
                .setDescription(this.descriptions.options.team)
                .setRequired(true),
            )
            .addStringOption(
              option => option
                .setName(Options.Description)
                .setDescription(this.descriptions.options.description)
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
            )
            .addStringOption(
              option => option
                .setName(Options.Field)
                .setDescription(this.descriptions.options.field)
                .setRequired(true)
                .setChoices(
                  { name: 'nom', value: OptionFieldChoices.Name },
                  { name: 'contact', value: OptionFieldChoices.Contact },
                  { name: 'équipes', value: OptionFieldChoices.Team },
                  { name: 'description', value: OptionFieldChoices.Description },
                ),
            )
            .addStringOption(
              option => option
                .setName('value')
                .setDescription(this.descriptions.options.value)
                .setRequired(true),
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
        ),
    );
  }

  public async create(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    await Contact.create({
      name: interaction.options.getString(Options.Name, true),
      contact: interaction.options.getString(Options.Contact, true),
      team: interaction.options.getString(Options.Team, true),
      description: interaction.options.getString(Options.Description, true),
      guildId: interaction.guildId,
    });
    await interaction.reply(this.messages.createdContact);
  }

  public async edit(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const targetName = interaction.options.getString(Options.Name, true);
    const contact = await Contact.findOne({ name: { $regex: new RegExp(targetName, 'i') }, guildId: interaction.guildId });
    if (!contact) {
      await interaction.reply({ content: this.messages.invalidContact, ephemeral: true });
      return;
    }

    const field = interaction.options.getString(Options.Field, true) as OptionFieldChoices;
    contact[field] = interaction.options.getString(Options.Value, true);
    await contact.save();

    await interaction.reply(this.messages.editedContact);
  }

  public async remove(interaction: HorizonSubcommand.ChatInputInteraction): Promise<void> {
    const targetName = interaction.options.getString(Options.Name, true);
    const contact = await Contact.findOne({ name: { $regex: new RegExp(targetName, 'i') }, guildId: interaction.guildId });
    if (!contact) {
      await interaction.reply({ content: this.messages.invalidContact, ephemeral: true });
      return;
    }

    await contact.deleteOne();

    await interaction.reply(this.messages.removedContact);
  }
}
