import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class PingCommand extends MonkaCommand {
  public async run(message: GuildMessage): Promise<void> {
    const msg = await message.channel.send(config.messages.firstMessage);

    await msg.edit(
      pupa(config.messages.secondMessage, {
        botPing: Math.round(this.context.client.ws.ping),
        apiPing: msg.createdTimestamp - message.createdTimestamp,
      }),
    );
  }
}
