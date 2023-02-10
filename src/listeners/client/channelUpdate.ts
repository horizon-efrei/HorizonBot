import { getContentForChannel } from '@/structures/logs/logChannelHelpers';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { DiscordLogType } from '@/types/database';
import { Listener } from '@sapphire/framework';
import type { DMChannel, GuildChannel } from 'discord.js';

export default class ChannelUpdateListener extends Listener {
  public async run(oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel): Promise<void> {
    if (oldChannel.isDMBased() || newChannel.isDMBased())
      return;

    if (oldChannel.name !== newChannel.name
      || oldChannel.parentId !== newChannel.parentId
      || oldChannel.position !== newChannel.position
      || oldChannel.flags.bitfield !== newChannel.flags.bitfield
      || oldChannel.permissionsLocked !== newChannel.permissionsLocked
      || oldChannel.type !== newChannel.type
      || !oldChannel.permissionOverwrites.cache.equals(newChannel.permissionOverwrites.cache)) {
      await DiscordLogManager.logAction({
        type: DiscordLogType.ChannelUpdate,
        context: newChannel.id,
        content: {
          before: getContentForChannel(oldChannel),
          after: getContentForChannel(newChannel),
        },
        guildId: newChannel.guild.id,
        severity: 1,
      });
    }
  }
}
