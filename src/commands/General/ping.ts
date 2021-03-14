import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import pupa from 'pupa';
import { ping as config } from '@/config/commands/general';
import MonkaCommand from '@/lib/MonkaCommand';

@ApplyOptions<CommandOptions>(config.options)
export default class PingCommand extends MonkaCommand {
  public async run(message: Message): Promise<void> {
    const msg = await message.channel.send(config.messages.firstMessage);

    await msg.edit(
      pupa(config.messages.secondMessage, {
        botPing: Math.round(this.context.client.ws.ping),
        apiPing: msg.createdTimestamp - message.createdTimestamp,
      }),
    );
  }
}
