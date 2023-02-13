import { container } from '@sapphire/framework';
import {
  ChannelFlagsBitField,
  channelMention,
  ChannelType,
  EmbedBuilder,
  roleMention,
} from 'discord.js';
import { isEqual, startCase } from 'lodash';
import pupa from 'pupa';
import messages from '@/config/messages';
import DiscordLogs from '@/models/discordLogs';
import * as CustomResolvers from '@/resolvers';
import type { DiscordLogBase } from '@/types/database';
import { ConfigEntriesChannels, DiscordLogType, LogStatuses } from '@/types/database';
import { makeMessageLink, trimText } from '@/utils';
import { getChannelPermissionDetails, getPermissionDetailsDiff, getRolePermissionDetails } from './snapshotHelpers';

const listAndFormatter = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });

type DiscordLogWithMessageContext = DiscordLogBase & ({ context: { channelId: string; messageId: string } });
const getMessageUrl = <T extends DiscordLogWithMessageContext>(payload: T): string =>
  makeMessageLink(payload.guildId, payload.context.channelId, payload.context.messageId);


// eslint-disable-next-line complexity
export function getContentValue(payload: DiscordLogBase): { content: string; longDetails?: string } {
  const guild = container.client.guilds.cache.get(payload.guildId);
  if (!guild)
    throw new Error(`Could not find guild with id ${payload.guildId}`);

  const fieldTexts = messages.logs.fields[payload.type];

  switch (payload.type) {
    case DiscordLogType.GuildJoin:
      return {
        content: payload.content
          .map(code => pupa(fieldTexts.contentValue, { code, link: guild.invites.cache.get(code) }))
          .join('\nou : ')
          || 'Inconnue',
      };
    case DiscordLogType.GuildLeave:
      return {
        content: pupa(fieldTexts.contentValue, {
          ...payload,
          content: {
            ...payload.content,
            roles: payload.content.roles.length > 0
              ? listAndFormatter.format(payload.content.roles.map(roleMention))
              : 'aucun',
            joinedAt: payload.content.joinedAt ? Math.round(payload.content.joinedAt / 1000) : null,
          },
        }),
      };
    case DiscordLogType.MemberRoleAdd:
    case DiscordLogType.MemberRoleRemove:
      return {
        content: pupa(fieldTexts.contentValue, {
          ...payload,
          content: listAndFormatter.format(payload.content.map(roleMention)),
        }),
      };
    case DiscordLogType.InvitePost:
      return {
        content: pupa(fieldTexts.contentValue, {
          ...payload,
          content: payload.content.join(', '),
          url: getMessageUrl(payload),
        }),
      };
    case DiscordLogType.MessageCreate:
    case DiscordLogType.MessageUpdate:
    case DiscordLogType.MessageDelete:
      return {
        content: pupa(fieldTexts.contentValue, {
          ...payload,
          content: typeof payload.content === 'string'
            ? trimText(payload.content)
            : { before: trimText(payload.content.before, 400), after: trimText(payload.content.after, 400) },
          url: getMessageUrl(payload),
        }),
      };
    case DiscordLogType.ReactionAdd:
    case DiscordLogType.ReactionRemove:
      return {
        content: pupa(fieldTexts.contentValue, {
          ...payload,
          content: CustomResolvers.resolveEmoji(payload.content, guild).unwrapOr(payload.content),
          url: getMessageUrl(payload),
        }),
      };
    case DiscordLogType.MemberNicknameUpdate:
    case DiscordLogType.UserUsernameUpdate:
    case DiscordLogType.VoiceJoin:
    case DiscordLogType.VoiceLeave:
    case DiscordLogType.VoiceMove:
      return {
        content: pupa(fieldTexts.contentValue, payload),
      };
    case DiscordLogType.ChannelCreate:
    case DiscordLogType.ChannelDelete:
      return {
        content: pupa(fieldTexts.contentValue, {
          name: payload.content.name,
          type: startCase(ChannelType[payload.content.type]),
          parentIfExist: payload.content.parentId ? channelMention(payload.content.parentId) : 'Aucun',
          synced: payload.content.permissionsLocked ? 'Oui' : 'Non',
          position: payload.content.position,
          flags: new ChannelFlagsBitField(payload.content.flags).toArray().join(', ') || 'Aucun',
        }),
        longDetails: getChannelPermissionDetails(guild, payload.content.permissionOverwrites),
      };
    case DiscordLogType.ChannelUpdate: {
      const { before, after } = payload.content;
      const parts = (fieldTexts as typeof messages.logs.fields[DiscordLogType.ChannelUpdate]).contentValueParts;

      const content = [] as string[];
      if (before.name !== after.name)
        content.push(parts.name);
      if (before.type !== after.type)
        content.push(parts.type);
      if (before.parentId !== after.parentId
        || before.permissionsLocked !== after.permissionsLocked)
        content.push(parts.parent);
      if (before.position !== after.position)
        content.push(parts.position);
      if (before.flags !== after.flags)
        content.push(parts.flags);
      if (!isEqual(before.permissionOverwrites, after.permissionOverwrites))
        content.push(parts.permissions);

      return {
        content: pupa(content.join('\n'), {
          before: {
            name: before.name,
            type: startCase(ChannelType[before.type]),
            parentIfExist: before.parentId ? channelMention(before.parentId) : 'Aucun',
            synced: before.permissionsLocked ? 'Oui' : 'Non',
            position: before.position,
            flags: new ChannelFlagsBitField(before.flags).toArray().join(', ') || 'Aucun',
          },
          after: {
            name: after.name,
            type: startCase(ChannelType[after.type]),
            parentIfExist: after.parentId ? channelMention(after.parentId) : 'Aucun',
            synced: after.permissionsLocked ? 'Oui' : 'Non',
            position: after.position,
            flags: new ChannelFlagsBitField(after.flags).toArray().join(', ') || 'Aucun',
          },
        }),
        longDetails: getPermissionDetailsDiff(guild, before.permissionOverwrites, after.permissionOverwrites),
      };
    }
    case DiscordLogType.RoleCreate:
    case DiscordLogType.RoleDelete:
      return {
        content: pupa(fieldTexts.contentValue, {
          name: payload.content.name,
          hexColor: payload.content.hexColor,
          hoist: payload.content.hoist ? 'Oui' : 'Non',
          managed: payload.content.managed ? 'Oui' : 'Non',
          mentionable: payload.content.mentionable ? 'Oui' : 'Non',
          position: payload.content.position,
        }),
        longDetails: getRolePermissionDetails(payload.content.permissions),
      };
    case DiscordLogType.RoleUpdate: {
      const parts = (fieldTexts as typeof messages.logs.fields[DiscordLogType.RoleUpdate]).contentValueParts;

      const content = [] as string[];
      if (payload.content.before.name !== payload.content.after.name)
        content.push(parts.name);
      if (payload.content.before.hexColor !== payload.content.after.hexColor)
        content.push(parts.color);
      if (payload.content.before.hoist !== payload.content.after.hoist)
        content.push(parts.hoist);
      if (payload.content.before.mentionable !== payload.content.after.mentionable)
        content.push(parts.mentionable);
      if (payload.content.before.managed !== payload.content.after.managed)
        content.push(parts.managed);
      if (payload.content.before.position !== payload.content.after.position)
        content.push(parts.position);
      if (payload.content.before.permissions !== payload.content.after.permissions)
        content.push(parts.permissions);

      return {
        content: pupa(content.join('\n'), {
          before: {
            name: payload.content.before.name,
            hexColor: payload.content.before.hexColor,
            hoist: payload.content.before.hoist ? 'Oui' : 'Non',
            managed: payload.content.before.managed ? 'Oui' : 'Non',
            mentionable: payload.content.before.mentionable ? 'Oui' : 'Non',
            position: payload.content.before.position,
          },
          after: {
            name: payload.content.after.name,
            hexColor: payload.content.after.hexColor,
            hoist: payload.content.after.hoist ? 'Oui' : 'Non',
            managed: payload.content.after.managed ? 'Oui' : 'Non',
            mentionable: payload.content.after.mentionable ? 'Oui' : 'Non',
            position: payload.content.after.position,
          },
        }),
        // TODO: add permission diff to longDetails.
        // longsDetails: getRolePermissionDetailsDiff(
        //   payload.content.before.permissions, payload.content.after.permissions),
      };
    }
  }
}

export async function logAction(payload: DiscordLogBase): Promise<void> {
  const guild = container.client.logStatuses.get(payload.guildId);
  if (!guild)
    throw new Error(`Could not find guild with id ${payload.guildId}`);

  const logStatus = guild.get(payload.type);
  if (logStatus === LogStatuses.Disabled)
    return;

  await DiscordLogs.create(payload);
  if (logStatus === LogStatuses.Silent)
    return;

  container.logger.info(`[Logs:${payload.type}] New logged event happened: ${JSON.stringify(payload)}`);
  if (logStatus === LogStatuses.Console)
    return;

  const logChannel = await container.client.configManager.get(ConfigEntriesChannels.Logs, payload.guildId);
  if (!logChannel)
    return;

  const fieldOptions = messages.logs.fields[payload.type];
  const { content: contentValue, longDetails } = getContentValue(payload);

  const embed = new EmbedBuilder()
    .setAuthor({ name: messages.logs.embedTitle })
    .setColor(fieldOptions.color)
    .setTitle(messages.logs.readableEvents[payload.type])
    .addFields([
      { name: fieldOptions.contextName, value: pupa(fieldOptions.contextValue, payload), inline: true },
      { name: fieldOptions.contentName, value: contentValue || "Impossible de charger plus d'informations", inline: true },
    ])
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });

  if (longDetails)
    await logChannel.send({ files: [{ name: 'details.txt', attachment: Buffer.from(longDetails) }] });
}
