import { Listener } from '@sapphire/framework';
import type { GuildChannel } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getContentForChannel } from '@/structures/logs/logChannelHelpers';
import { DiscordLogType } from '@/types/database';

export default class ChannelCreateListener extends Listener {
  public async run(channel: GuildChannel): Promise<void> {
    await DiscordLogManager.logAction({
      type: DiscordLogType.ChannelCreate,
      context: channel.id,
      content: getContentForChannel(channel),
      guildId: channel.guild.id,
      severity: 1,
    });
  }
}
