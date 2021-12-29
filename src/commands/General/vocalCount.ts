import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { BaseGuildVoiceChannel } from 'discord.js';
import pupa from 'pupa';
import { vocalCount as config } from '@/config/commands/general';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['GuildOnly'],
  generateDashLessAliases: true,
})
export default class VocalCountCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage, _args: Args): Promise<void> {
    const allChannels = [...message.guild.channels.cache.values()];
    const voiceChannels = allChannels
      .filter(chan => chan.isVoice() && chan.members.size > 0) as BaseGuildVoiceChannel[];
    const lines = voiceChannels
      .sort((chan1, chan2) => chan2.members.size - chan1.members.size)
      .map((chan, i) => pupa(config.messages.topLine, { index: i + 1, channelId: chan.id, count: chan.members.size }));

    await message.channel.send(
      lines.length > 0
        ? lines.join('\n')
        : config.messages.noOnlineMembers,
    );
  }
}
