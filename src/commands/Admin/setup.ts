import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { setup as config } from '@/config/commands/admin';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import { ConfigEntries } from '@/types/database';

@ApplyOptions<CommandOptions>(config.options)
export default class SetupCommand extends MonkaCommand {
  // eslint-disable-next-line complexity
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // TODO: Add subcommands to get/set/remove/list etc
    const channelType = await args.pickResult('string');
    const channel = (await args.pickResult('guildTextBasedChannel'))?.value || message.channel;
    switch (channelType.value) {
      case 'moderator':
      case 'moderators':
      case 'moderateur':
      case 'moderateurs':
      case 'modo':
      case 'modos':
      case 'mod':
      case 'mods':
        await this.context.client.configManager.set(ConfigEntries.ModeratorFeedback, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      case 'class-l1':
      case 'eclass-l1':
      case 'classe-l1':
      case 'eclasse-l1':
      case 'cours-l1':
      case 'ecours-l1':
        await this.context.client.configManager.set(ConfigEntries.ClassAnnoucementL1, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      case 'class-l2':
      case 'eclass-l2':
      case 'classe-l2':
      case 'eclasse-l2':
      case 'cours-l2':
      case 'ecours-l2':
        await this.context.client.configManager.set(ConfigEntries.ClassAnnoucementL2, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      case 'class-l3':
      case 'eclass-l3':
      case 'classe-l3':
      case 'eclasse-l3':
      case 'cours-l3':
      case 'ecours-l3':
        await this.context.client.configManager.set(ConfigEntries.ClassAnnoucementL3, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      case 'class-general':
      case 'eclass-general':
      case 'classe-general':
      case 'eclasse-general':
      case 'cours-general':
      case 'ecours-general':
        await this.context.client.configManager.set(ConfigEntries.ClassAnnoucementGeneral, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      case 'week-class':
      case 'week-classes':
      case 'week-upcoming-class':
      case 'week-upcoming-classes':
        await this.context.client.configManager.set(ConfigEntries.WeekUpcomingClasses, channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      default:
        await message.channel.send(config.messages.unknown);
    }
  }
}
