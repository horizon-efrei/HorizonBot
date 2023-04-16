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
import _ from 'lodash';
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

function getReadableTarget(id: string, type: OverwriteType, guild: Guild): string {
  return [
    type === OverwriteType.Role ? 'le rôle' : "l'utilisateur",
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (type === OverwriteType.Role ? guild.roles.cache.get(id)?.name : guild.members.cache.get(id)?.user.tag) || `Inconnu (${id})`,
  ].join(' ');
}

export function getChannelPermissionDetails(
  guild: Guild,
  permissionOverwrites: SerializedPermissions,
): string {
  return Object.values(permissionOverwrites)
    .map(value =>
      [
        `Permissions pour ${getReadableTarget(value.id, value.type, guild)} :`,
        new PermissionsBitField(value.allow).toArray().map(perm => `  ${_.startCase(perm)}: ✅`).join('\n'),
        new PermissionsBitField(value.deny).toArray().map(perm => `  ${_.startCase(perm)}: ❌`).join('\n'),
      ].filter(filterNullAndUndefinedAndEmpty).join('\n'))
    .join('\n\n');
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const readablePermissions = ({ allow, deny, ...props }: SerializedPermissions[string]) => ({
  ...props,
  allow: new PermissionsBitField(allow).toArray(),
  deny: new PermissionsBitField(deny).toArray(),
});

export function getPermissionDetailsDiff(
  guild: Guild,
  before: SerializedPermissions,
  after: SerializedPermissions,
): string {
  const permsBefore = _.mapValues(before, readablePermissions);
  const permsAfter = _.mapValues(after, readablePermissions);

  const missingFieldsInBefore = _.difference(Object.keys(permsAfter), Object.keys(permsBefore));
  for (const field of missingFieldsInBefore) {
    permsBefore[field] = {
      id: field,
      type: permsAfter[field].type,
      allow: [],
      deny: [],
    };
  }

  return Object.values(permsBefore)
    .map((value) => {
      const { allow: allowedBefore, deny: deniedBefore } = value;

      if (!permsAfter[value.id]) {
        return [
          `Permissions pour ${getReadableTarget(value.id, value.type, guild)} (retiré) :`,
          ...allowedBefore.map(perm => `  ${perm}: ✅ → ◽️`),
          ...deniedBefore.map(perm => `  ${perm}: ❌ → ◽️`),
        ].join('\n');
      }

      const { allow: allowedAfter, deny: deniedAfter } = permsAfter[value.id];

      if (_.isEqual(allowedBefore, allowedAfter) && _.isEqual(deniedBefore, deniedAfter))
        return null;

      const lines = [] as string[];

      for (const perm of allowedBefore) {
        if (deniedAfter.includes(perm))
          lines.push(`  ${perm}: ✅ → ❌`);
        else if (!allowedAfter.includes(perm))
          lines.push(`  ${perm}: ✅ → ◽️`);
      }

      for (const perm of deniedBefore) {
        if (allowedAfter.includes(perm))
          lines.push(`  ${perm}: ❌ → ✅`);
        else if (!deniedAfter.includes(perm))
          lines.push(`  ${perm}: ❌ → ◽️`);
      }

      for (const perm of allowedAfter) {
        if (!allowedBefore.includes(perm) && !deniedBefore.includes(perm))
          lines.push(`  ${perm}: ◽️ → ✅`);
      }

      for (const perm of deniedAfter) {
        if (!deniedBefore.includes(perm) && !allowedBefore.includes(perm))
          lines.push(`  ${perm}: ◽️ → ❌`);
      }

      return [
        `Permissions pour ${getReadableTarget(value.id, value.type, guild)} :`,
        ...lines,
      ].join('\n');
    })
    .filter(filterNullAndUndefinedAndEmpty)
    .join('\n\n');
}

export function getRolePermissionDetails(bitfield: bigint | `${bigint}`): string {
  return new PermissionsBitField(bitfield).toArray().map(perm => `${_.startCase(perm)}: ✅`).join('\n');
}

export function getRolePermissionDetailsDiff(before: bigint | `${bigint}`, after: bigint | `${bigint}`): string {
  const beforeArray = new PermissionsBitField(before).toArray();
  const afterArray = new PermissionsBitField(after).toArray();

  const lines = [] as string[];

  for (const perm of beforeArray) {
    if (!afterArray.includes(perm))
      lines.push(`  ${perm}: ✅ → ◽️`);
  }

  for (const perm of afterArray) {
    if (!beforeArray.includes(perm))
      lines.push(`  ${perm}: ◽️ → ✅`);
  }

  return lines.join('\n');
}
