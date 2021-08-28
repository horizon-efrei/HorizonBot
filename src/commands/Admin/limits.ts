import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { limits as config } from '@/config/commands/admin';
import MonkaCommand from '@/structures/commands/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class LimitsCommand extends MonkaCommand {
  public async run(message: GuildMessage): Promise<void> {
    await message.channel.send(pupa(config.messages.limits, {
      channels: message.guild.channels.cache.size,
      roles: message.guild.roles.cache.size,
      channelsLeft: 500 - message.guild.channels.cache.size,
      rolesLeft: 250 - message.guild.roles.cache.size,
    }));
  }
}
