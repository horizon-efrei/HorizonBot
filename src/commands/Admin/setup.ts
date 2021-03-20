import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { setup as config } from '@/config/commands/admin';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import { ConfigEntries } from '@/types/database';

@ApplyOptions<CommandOptions>(config.options)
export default class SetupCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    // TODO: Add subcommands to get/set/remove/list etc
    const channel = await args.pickResult('string');
    switch (channel.value) {
      case 'moderator':
      case 'moderators':
      case 'moderateur':
      case 'moderateurs':
      case 'modo':
      case 'modos':
      case 'mod':
      case 'mods':
        await this.context.client.configManager.set(ConfigEntries.ModeratorFeedback, message.channel);
        await message.channel.send(config.messages.successfullyDefined);
        break;
      default:
        await message.channel.send(config.messages.unknown);
    }
  }
}
