import { Listener } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type { VoiceState } from 'discord.js';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export default class VoiceStateUpdateListener extends Listener {
  public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!oldState.member || !newState.member)
      return;

    // Was not in a channel, but now is
    if (isNullish(oldState.channel) && newState.channel?.isVoice()) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.VoiceJoin,
        context: newState.member.id,
        content: newState.channel.id,
        guildId: newState.guild.id,
        severity: 1,
      });
    } else if (oldState.channel?.isVoice() && isNullish(newState.channel)) {
      // Was in a channel, but now isn't
      await DiscordLogManager.logAction({
        type: DiscordLogType.VoiceLeave,
        context: newState.member.id,
        content: oldState.channel.id,
        guildId: newState.guild.id,
        severity: 1,
      });
    } else if (oldState.channel?.isVoice()
      && newState.channel?.isVoice()
      && oldState.channel.id !== newState.channel.id) {
      // Changed its channel
      await DiscordLogManager.logAction({
        type: DiscordLogType.VoiceMove,
        context: newState.member.id,
        content: { before: oldState.channel.id, after: newState.channel.id },
        guildId: newState.guild.id,
        severity: 1,
      });
    }
  }
}
