import { ApplyOptions } from '@sapphire/decorators';
import type { BaseGuildVoiceChannel } from 'discord.js';
import pupa from 'pupa';
import { vocalCount as config } from '@/config/commands/general';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

@ApplyOptions<HorizonCommand.Options>(config)
export default class VocalCountCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    const voiceChannels = [...interaction.guild.channels.cache.values()]
      .filter(chan => chan.isVoice() && chan.members.size > 0) as BaseGuildVoiceChannel[];

    if (voiceChannels.length === 0) {
      await interaction.reply({ content: this.messages.noOnlineMembers, ephemeral: true });
      return;
    }

    const lines = voiceChannels
      .sort((chan1, chan2) => chan2.members.size - chan1.members.size)
      .map((chan, i) => pupa(this.messages.topLine, { index: i + 1, channelId: chan.id, count: chan.members.size }))
      .join('\n');
    await interaction.reply(lines);
  }
}
