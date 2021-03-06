import { container } from '@sapphire/pieces';
import { Formatters, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import DiscordLogs from '@/models/discordLogs';
import * as CustomResolvers from '@/resolvers';
import type { DiscordLogBase } from '@/types/database';
import { ConfigEntriesChannels, DiscordLogType, LogStatuses } from '@/types/database';
import { makeMessageLink, trimText } from '@/utils';

const listAndFormatter = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });

type DiscordLogWithMessageContext = DiscordLogBase & ({ context: { channelId: string; messageId: string } });
const getMessageUrl = <T extends DiscordLogWithMessageContext>(payload: T): string =>
  makeMessageLink(payload.guildId, payload.context.channelId, payload.context.messageId);

export function getContentValue(payload: DiscordLogBase): string {
  const guild = container.client.guilds.cache.get(payload.guildId);
  const fieldTexts = messages.logs.fields[payload.type];

  switch (payload.type) {
    case DiscordLogType.GuildJoin: {
      const invites = guild.invites.cache;
      return payload.content.map(code => pupa(fieldTexts.contentValue, { code, link: invites.get(code) })).join('\nou : ');
    }
    case DiscordLogType.GuildLeave: {
      return pupa(fieldTexts.contentValue, {
        ...payload,
        content: {
          ...payload.content,
          roles: payload.content.roles.length > 0
            ? listAndFormatter.format(payload.content.roles.map(Formatters.roleMention))
            : 'aucun',
          joinedAt: Math.round(payload.content.joinedAt / 1000),
        },
      });
    }
    case DiscordLogType.RoleAdd:
    case DiscordLogType.RoleRemove:
      return pupa(fieldTexts.contentValue, {
        ...payload,
        content: listAndFormatter.format(payload.content.map(Formatters.roleMention)),
      });
    case DiscordLogType.InvitePost:
      return pupa(fieldTexts.contentValue, {
        ...payload,
        content: payload.content.join(', '),
        url: getMessageUrl(payload),
      });
    case DiscordLogType.MessagePost:
    case DiscordLogType.MessageEdit:
    case DiscordLogType.MessageRemove:
      return pupa(fieldTexts.contentValue, {
        ...payload,
        content: trimText(typeof payload.content === 'string' ? payload.content : payload.content.after),
        url: getMessageUrl(payload),
      });
    case DiscordLogType.ReactionAdd:
    case DiscordLogType.ReactionRemove:
      return pupa(fieldTexts.contentValue, {
        ...payload,
        content: CustomResolvers.resolveEmoji(payload.content, guild).value ?? payload.content,
        url: getMessageUrl(payload),
      });
    case DiscordLogType.ChangeNickname:
    case DiscordLogType.ChangeUsername:
    case DiscordLogType.VoiceJoin:
    case DiscordLogType.VoiceLeave:
    case DiscordLogType.VoiceMove:
      return pupa(fieldTexts.contentValue, payload);
  }
}

export async function logAction(payload: DiscordLogBase): Promise<void> {
  const logStatus = container.client.logStatuses.get(payload.guildId).get(payload.type);
  if (logStatus === LogStatuses.Disabled)
    return;

  await DiscordLogs.create(payload);
  if (logStatus === LogStatuses.Silent)
    return;

  container.logger.info(`[Logs:${DiscordLogType[payload.type]}] New logged event happend: ${JSON.stringify(payload, (k, v) => (k === 'type' ? DiscordLogType[v] : v))}`);
  if (logStatus === LogStatuses.Console)
    return;

  const logChannel = await container.client.configManager.get(ConfigEntriesChannels.Logs, payload.guildId);
  if (!logChannel)
    return;

  const fieldOptions = messages.logs.fields[payload.type];
  const contentValue: string = this.getContentValue(payload);

  const embed = new MessageEmbed()
    .setAuthor({ name: messages.logs.embedTitle })
    .setColor(fieldOptions.color)
    .setTitle(messages.logs.readableEvents[payload.type])
    .addField(fieldOptions.contextName, pupa(fieldOptions.contextValue, payload), true)
    .addField(fieldOptions.contentName, contentValue, true)
    .setTimestamp();
  await logChannel?.send({ embeds: [embed] });
}
