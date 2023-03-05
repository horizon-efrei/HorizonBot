import { Listener } from '@sapphire/framework';
import type {
  Collection,
  DMChannel,
  GuildAuditLogsEntry,
  GuildChannel,
  PermissionOverwrites,
  User,
} from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import _ from 'lodash';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getChannelSnapshot, serializePermissions } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

type ChannelUpdateAuditLogEntries = Collection<string, GuildAuditLogsEntry<AuditLogEvent.ChannelOverwriteUpdate>
  | GuildAuditLogsEntry<AuditLogEvent.ChannelUpdate>>;

export default class ChannelUpdateListener extends Listener {
  private readonly _buffer = new Map<string, { oldChannel: GuildChannel; newChannel: GuildChannel }>();

  public async run(oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel): Promise<void> {
    if (oldChannel.isDMBased() || newChannel.isDMBased())
      return;

    const propertyUpdated = oldChannel.name !== newChannel.name
      || oldChannel.parentId !== newChannel.parentId
      || oldChannel.position !== newChannel.position
      || oldChannel.flags.bitfield !== newChannel.flags.bitfield
      || oldChannel.permissionsLocked !== newChannel.permissionsLocked
      || oldChannel.type !== newChannel.type;

    const permissionUpdated = this._permissionChanged(
      oldChannel.permissionOverwrites.cache,
      newChannel.permissionOverwrites.cache,
    );

    if (propertyUpdated || permissionUpdated) {
      const auditLogs = propertyUpdated
        ? await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate }).catch(nullop)
        : permissionUpdated
          ? await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelOverwriteUpdate }).catch(nullop)
          : null;

      const lastChannelUpdate = (auditLogs?.entries as ChannelUpdateAuditLogEntries | undefined)
        ?.filter(entry => entry.target?.id === newChannel.id && entry.createdTimestamp > Date.now() - 2000)
        .first();

      const mapKey = this._getKey(newChannel, lastChannelUpdate?.executor);

      this._buffer.emplace(mapKey, {
        insert: () => ({ oldChannel, newChannel }),
        update: existing => ({ ...existing, newChannel }),
      });

      setTimeout(async () => {
        if (!this._buffer.has(mapKey))
          return;

        const changeSet = this._buffer.get(mapKey)!;
        this._buffer.delete(mapKey);

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

  private _getKey(channel: GuildChannel, executor: User | null | undefined): string {
    return `${channel.id}-${executor?.id ?? Date.now()}`;
  }
}
