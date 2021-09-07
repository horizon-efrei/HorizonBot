import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { limits as config } from '@/config/commands/admin';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['StaffOnly'],
})
export default class LimitsCommand extends HorizonCommand {
  public async run(message: GuildMessage): Promise<void> {
    await message.channel.send(pupa(config.messages.limits, {
      channels: message.guild.channels.cache.size,
      roles: message.guild.roles.cache.size,
      channelsLeft: 500 - message.guild.channels.cache.size,
      rolesLeft: 250 - message.guild.roles.cache.size,
    }));
  }
}
