import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { MessageEmbed } from 'discord.js';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import { contacts as config } from '@/config/commands/general';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Contact from '@/models/contact';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import type { ContactDocument } from '@/types/database';

@ApplyOptions<HorizonCommand.Options>(config)
export default class ContactsCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false),
    );
  }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      await interaction.reply(this.messages.noContacts);
      return;
    }

    type TeamEntry = [teamName: string, contacts: ContactDocument[]];
    const teams: TeamEntry[] = Object.entries(groupBy(contacts, contact => contact.team));

    const paginator = new PaginatedMessage({ template: new MessageEmbed().setColor(settings.colors.default) })
      .setWrongUserInteractionReply(user => ({
        content: pupa(messages.errors.wrongUserInteractionReply, { user }),
        ephemeral: true,
        allowedMentions: { users: [], roles: [] },
      }))
      .setSelectMenuOptions(pageIndex => ({
        label: teams[pageIndex - 1][0],
        description: pupa(this.messages.selectMenuItemDescription, { pageIndex }),
        emoji: this.messages.selectMenuItemEmoji,
      }));
    const selectMenuAction = PaginatedMessage.defaultActions
      .find(action => 'customId' in action && action.customId === '@sapphire/paginated-messages.goToPage');
    paginator.setActions(selectMenuAction ? [selectMenuAction] : []);

    for (const [teamName, teamContacts] of teams) {
      paginator.addPageEmbed(embed =>
        embed.setTitle(pupa(this.messages.pageTitle, { teamName }))
          .addFields(teamContacts.map(contact => ({
            name: contact.name,
            value: pupa(this.messages.listLine, contact),
            inline: true,
          }))));
    }

    await paginator.run(interaction);
  }
}
