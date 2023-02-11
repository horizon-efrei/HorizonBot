import { Listener } from '@sapphire/framework';
import type { DMChannel, GuildChannel } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getChannelSnapshot } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';

export default class ChannelUpdateListener extends Listener {
  private readonly _buffer = new Map<string, { oldChannel: GuildChannel; newChannel: GuildChannel }>();

  public run(oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel): void {
    if (oldChannel.isDMBased() || newChannel.isDMBased())
      return;

    if (oldChannel.name !== newChannel.name
      || oldChannel.parentId !== newChannel.parentId
      || oldChannel.position !== newChannel.position
      || oldChannel.flags.bitfield !== newChannel.flags.bitfield
      || oldChannel.permissionsLocked !== newChannel.permissionsLocked
      || oldChannel.type !== newChannel.type
      || !oldChannel.permissionOverwrites.cache.equals(newChannel.permissionOverwrites.cache)) {
      this._buffer.emplace(newChannel.id, {
        insert: () => ({ oldChannel, newChannel }),
        update: existing => ({ ...existing, newChannel }),
      });

      setTimeout(async () => {
        if (!this._buffer.has(newChannel.id))
          return;

        const changeSet = this._buffer.get(newChannel.id)!;
        this._buffer.delete(newChannel.id);

        await DiscordLogManager.logAction({
          type: DiscordLogType.ChannelUpdate,
          context: newChannel.id,
          content: {
            before: getChannelSnapshot(changeSet.oldChannel),
            after: getChannelSnapshot(changeSet.newChannel),
          },
          guildId: newChannel.guild.id,
          severity: 1,
        });
      }, 3000);
    }
  }
}
