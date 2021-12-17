import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';

@ApplyOptions<CommandOptions>(config.options)
export default class PingCommand extends HorizonCommand {
  public async messageRun(message: Message): Promise<void> {
    const msg = await message.channel.send(config.messages.firstMessage);

    await msg.edit(
      pupa(config.messages.secondMessage, {
        botPing: Math.round(this.container.client.ws.ping),
        apiPing: msg.createdTimestamp - message.createdTimestamp,
      }),
    );
  }
}
