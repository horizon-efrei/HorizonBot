import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { vocalCount as config } from '@/config/commands/general';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({ ...config.options, generateDashLessAliases: true })
export default class VocalCountCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const channel = message.member.voice.channel ?? (await args.pickResult('voiceChannel'))?.value;
    if (!channel) {
      await message.channel.send(config.messages.invalidUse);
      return;
    }
    const count = channel.members.size;
    await message.channel.send(pupa(config.messages.count, { count, plural: count > 1 ? 's' : '' }));
  }
}
