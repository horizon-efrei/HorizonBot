import { filterNullAndUndefinedAndEmpty } from '@sapphire/utilities';
import type {
  Collection,
  Guild,
  GuildChannel,
  PermissionOverwrites,
  Role,
  Snowflake,
} from 'discord.js';
import { OverwriteType, PermissionsBitField } from 'discord.js';
import { startCase } from 'lodash';
import type { ChannelSnapshot, RoleSnapshot } from '@/types/database';

interface PermissionOverwrite { id: string; type: OverwriteType; allow: PermissionsBitField; deny: PermissionsBitField }
type SerializedPermissions = ChannelSnapshot['permissionOverwrites'];

export function serializePermissions(permissions: Collection<Snowflake, PermissionOverwrites>): SerializedPermissions {
  return Object.fromEntries(
    permissions
      .mapValues((value) => {
        const { allow, deny, ...keep } = value.toJSON() as PermissionOverwrite;
        return {
          ...keep,
          allow: allow.bitfield.toString() as `${bigint}`,
          deny: deny.bitfield.toString() as `${bigint}`,
        };
      })
      .entries(),
  );
}

export function getChannelSnapshot(channel: GuildChannel): ChannelSnapshot {
  return {
    id: channel.id,
    flags: channel.flags.bitfield,
    name: channel.name,
    parentId: channel.parentId,
    permissionOverwrites: serializePermissions(channel.permissionOverwrites.cache),
    permissionsLocked: channel.permissionsLocked,
    position: channel.position,
    type: channel.type,
  };
}

export function getRoleSnapshot(role: Role): RoleSnapshot {
  return {
    id: role.id,
    name: role.name,
    hexColor: role.hexColor,
    hoist: role.hoist,
    managed: role.managed,
    mentionable: role.mentionable,
    permissions: role.permissions.bitfield.toString() as `${bigint}`,
    position: role.position,
  };
}

export function getChannelPermissionDetails(
  guild: Guild,
  permissionOverwrites: SerializedPermissions,
): string {
  return Object.values(permissionOverwrites)
    .map(value =>
      [
        `Permissions pour ${value.type === OverwriteType.Role ? 'le rôle' : "l'utilisateur"} ${value.type === OverwriteType.Role
          ? guild.roles.cache.get(value.id)?.name
          : guild.members.cache.get(value.id)?.user.tag} :`,
        new PermissionsBitField(value.allow).toArray().map(perm => `  ${startCase(perm)}: ✅`).join('\n'),
        new PermissionsBitField(value.deny).toArray().map(perm => `  ${startCase(perm)}: ❌`).join('\n'),
      ].filter(filterNullAndUndefinedAndEmpty).join('\n'))
    .join('\n\n');
}

// TODO: add getChannelPermissionDetailsDiff(Guild, SerializedPermissions, SerializedPermissions): string;

export function getRolePermissionDetails(bitfield: bigint | `${bigint}`): string {
  return new PermissionsBitField(bitfield).toArray().map(perm => `${startCase(perm)}: ✅`).join('\n');
}

// TODO: add getRolePermissionDetailsDiff(bigint, bigint): string;
