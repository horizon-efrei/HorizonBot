import { Listener } from '@sapphire/framework';
import type {
  Collection,
  DMChannel,
  GuildChannel,
  PermissionOverwrites,
} from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import _ from 'lodash';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getChannelSnapshot, serializePermissions } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

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
      || this._permissionChanged(oldChannel.permissionOverwrites.cache, newChannel.permissionOverwrites.cache)) {
      this._buffer.emplace(newChannel.id, {
        insert: () => ({ oldChannel, newChannel }),
        update: existing => ({ ...existing, newChannel }),
      });

      setTimeout(async () => {
        if (!this._buffer.has(newChannel.id))
          return;

        const changeSet = this._buffer.get(newChannel.id)!;
        this._buffer.delete(newChannel.id);

        const auditLogs = await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate }).catch(nullop);
        const lastChannelUpdate = auditLogs?.entries
          .filter(entry => entry.target?.id === newChannel.id && entry.createdTimestamp > Date.now() - 5000)
          .first();

        await DiscordLogManager.logAction({
          type: DiscordLogType.ChannelUpdate,
          context: {
            channelId: newChannel.id,
            executorId: lastChannelUpdate?.executor?.id,
          },
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

  private _permissionChanged(
    oldPermissionOverwrites: Collection<string, PermissionOverwrites>,
    newPermissionOverwrites: Collection<string, PermissionOverwrites>,
  ): boolean {
    const oldPermissions = serializePermissions(oldPermissionOverwrites);
    const newPermissions = serializePermissions(newPermissionOverwrites);

    if (_.isEqual(oldPermissions, newPermissions))
      return false;

    const difference = _.pickBy(newPermissions, (value, key) => !_.isEqual(value, oldPermissions[key]));

    // When we add a role a user to the permission overwrite, they are first added with allow: 0 and deny: 0
    // This is not an interesting change, so we filter those out
    const noPermissionChanges = Object.values(difference)
      .map(({ allow, deny }) => ({ allow: Number(allow), deny: Number(deny) }))
      .filter(({ allow, deny }) => allow !== 0 || deny !== 0);

    return noPermissionChanges.length > 0;
  }
}
