import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { contact as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import { IsStaff } from '@/decorators';
import Contact from '@/models/contact';
import ContactInteractiveBuilder from '@/structures/ContactInteractiveBuilder';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import { GuildMessage } from '@/types';
import type { ContactDocument } from '@/types/database';
import { generateSubcommands } from '@/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  subCommands: generateSubcommands(['create', 'list', 'edit', 'remove', 'help'], 'list'),
})
export default class ContactCommand extends HorizonSubCommand {
  @IsStaff()
  public async create(message: GuildMessage, _args: Args): Promise<void> {
    const responses = await new ContactInteractiveBuilder(message).start();
    if (!responses)
      return;

    await Contact.create(responses);
    await message.channel.send(config.messages.createdContact);
  }

  @IsStaff()
  public async edit(message: GuildMessage, args: Args): Promise<void> {
    const targetName = await args.pickResult('string');
    const contact = await Contact.findOne({ name: { $regex: new RegExp(targetName.value, 'i') } });
    if (!contact) {
      await message.channel.send(config.messages.invalidContact);
      return;
    }

    const field = await args.pickResult('string');
    switch (field.value) {
      case 'name':
      case 'nom':
        contact.name = (await args.restResult('string')).value;
        break;
      case 'contact':
      case 'mail':
      case 'email':
        contact.contact = (await args.restResult('string')).value;
        break;
      case 'description':
      case 'desc':
        contact.description = (await args.restResult('string')).value;
        break;
      case 'team':
      case 'equipe':
      case 'équipe':
      case 'service':
        contact.team = (await args.restResult('string')).value;
        break;
      default:
        await message.channel.send(config.messages.invalidField);
        return;
    }

    await contact.save();
    await message.channel.send(config.messages.editedContact);
  }

  @IsStaff()
  public async remove(message: GuildMessage, args: Args): Promise<void> {
    const targetName = await args.pickResult('string');
    const contact = await Contact.findOne({ name: { $regex: new RegExp(targetName.value, 'i') } });
    if (!contact) {
      await message.channel.send(config.messages.invalidContact);
      return;
    }

    await contact.remove();
    await message.channel.send(config.messages.removedContact);
  }

  public async list(message: Message, _args: Args): Promise<void> {
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      await message.channel.send(config.messages.noContacts);
      return;
    }

    type TeamEntry = [teamName: string, contacts: ContactDocument[]];
    const teams: TeamEntry[] = Object.entries(groupBy(contacts, contact => contact.team));

    const paginator = new PaginatedMessage({ template: new MessageEmbed().setColor(settings.colors.default) })
      .setSelectMenuOptions(pageIndex => ({
        label: teams[pageIndex - 1][0],
        description: pupa(config.messages.selectMenuItemDescription, { pageIndex }),
        emoji: config.messages.selectMenuItemEmoji,
      }));
    const selectMenuAction = PaginatedMessage.defaultActions.find(action => action.customId === '@sapphire/paginated-messages.goToPage');
    paginator.setActions([selectMenuAction]);

    for (const [teamName, teamContacts] of teams) {
      paginator.addPageEmbed(embed =>
        embed.setTitle(pupa(config.messages.pageTitle, { teamName }))
          .addFields(teamContacts.map(contact => ({
            name: contact.name,
            value: pupa(config.messages.listLine, contact),
            inline: true,
          }))));
    }

    await paginator.run(message);
  }

  public async help(message: Message, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields([...config.messages.helpEmbedDescription])
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
