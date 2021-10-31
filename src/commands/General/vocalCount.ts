import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { BaseGuildVoiceChannel } from 'discord.js';
import pupa from 'pupa';
import { vocalCount as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

const allFlags = ['a', 'all'];

@ApplyOptions<CommandOptions>({
  ...config.options,
  flags: [...allFlags],
  generateDashLessAliases: true,
})
export default class VocalCountCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const channel = (await args.pickResult('guildVoiceChannel'))?.value ?? message.member.voice.channel;
    if (!channel || args.getFlags(...allFlags)) {
      const voiceChannels = [...message.guild.channels.cache.values()]
        .filter((chan): chan is BaseGuildVoiceChannel => chan.isVoice() && chan.members.size > 0)
        .sort((chan1, chan2) => chan2.members.size - chan1.members.size)
        .map((chan, i) => pupa(config.messages.topLine, { index: i + 1, name: chan.name, count: chan.members.size }));

      await message.channel.send(
        voiceChannels.length > 0
          ? voiceChannels.join('\n')
          : config.messages.noOnlineMembers,
      );
      return;
    }

    await message.channel.send(pupa(config.messages.count, { count: channel.members.size }));
  }
}
