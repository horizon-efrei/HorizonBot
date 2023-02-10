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
import { getPermissionDetails } from './logChannelHelpers';

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
        longDetails: getPermissionDetails(guild, payload.content.permissionOverwrites),
      };
    case DiscordLogType.ChannelUpdate: {
      const parts = (fieldTexts as typeof messages.logs.fields[DiscordLogType.ChannelUpdate]).contentValueParts;

      const content = [] as string[];
      if (payload.content.before.name !== payload.content.after.name)
        content.push(parts.name);
      if (payload.content.before.type !== payload.content.after.type)
        content.push(parts.type);
      if (payload.content.before.parentId !== payload.content.after.parentId
        || payload.content.before.permissionsLocked !== payload.content.after.permissionsLocked)
        content.push(parts.parent);
      if (payload.content.before.position !== payload.content.after.position)
        content.push(parts.position);
      if (payload.content.before.flags !== payload.content.after.flags)
        content.push(parts.flags);
      if (!isEqual(payload.content.before.permissionOverwrites, payload.content.after.permissionOverwrites))
        content.push(parts.permissions);

      return {
        content: pupa(content.join('\n'), {
          before: {
            name: payload.content.before.name,
            type: startCase(ChannelType[payload.content.before.type]),
            parentIfExist: payload.content.before.parentId ? channelMention(payload.content.before.parentId) : 'Aucun',
            synced: payload.content.before.permissionsLocked ? 'Oui' : 'Non',
            position: payload.content.before.position,
            flags: new ChannelFlagsBitField(payload.content.before.flags).toArray().join(', ') || 'Aucun',
          },
          after: {
            name: payload.content.after.name,
            type: startCase(ChannelType[payload.content.after.type]),
            parentIfExist: payload.content.after.parentId ? channelMention(payload.content.after.parentId) : 'Aucun',
            synced: payload.content.after.permissionsLocked ? 'Oui' : 'Non',
            position: payload.content.after.position,
            flags: new ChannelFlagsBitField(payload.content.after.flags).toArray().join(', ') || 'Aucun',
          },
        }),
        // TODO: add permission diff to longDetails.
        // longsDetails: getPermissionDetailsDiff(guild,
        //   payload.content.before.permissionOverwrites,
        //   payload.content.after.permissionOverwrites),
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
  const { content: contentValue, longDetails } = getContentValue(payload) ?? { content: "Impossible de charger plus d'informations" };

  const embed = new EmbedBuilder()
    .setAuthor({ name: messages.logs.embedTitle })
    .setColor(fieldOptions.color)
    .setTitle(messages.logs.readableEvents[payload.type])
    .addFields([
      { name: fieldOptions.contextName, value: pupa(fieldOptions.contextValue, payload), inline: true },
      { name: fieldOptions.contentName, value: contentValue, inline: true },
    ])
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });

  if (longDetails)
    await logChannel.send({ files: [{ name: 'details.txt', attachment: Buffer.from(longDetails) }] });
}
