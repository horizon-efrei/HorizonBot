import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { vocalCount as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({ ...config.options, generateDashLessAliases: true })
export default class VocalCountCommand extends HorizonCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const channel = (await args.pickResult('guildVoiceChannel'))?.value ?? message.member.voice.channel;
    if (!channel) {
      await message.channel.send(config.messages.invalidUse);
      return;
    }
    const count = channel.members.size;
    await message.channel.send(pupa(config.messages.count, { count, plural: count > 1 ? 's' : '' }));
  }
}
