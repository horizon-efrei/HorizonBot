import {
  ChannelMentionRegex,
  isNewsChannel,
  isTextChannel,
  MessageLinkRegex,
  RoleMentionRegex,
  SnowflakeRegex,
  UserOrMemberMentionRegex,
} from '@sapphire/discord.js-utilities';
import type {
  Guild,
  GuildMember,
  Role,
  User,
 } from 'discord.js';
import { Permissions } from 'discord.js';
import type { GuildMessage, GuildTextBasedChannel, HourMinutes } from '@/types';
import { getDuration, nullop } from '@/utils';

const DATE_REGEX = /^(?<day>\d{1,2})[/-](?<month>\d{1,2})$/imu;

export default {
  resolveChannelByID(argument: string, guild: Guild): GuildTextBasedChannel {
    const channelID = ChannelMentionRegex.exec(argument) ?? SnowflakeRegex.exec(argument);
    const channel = guild.channels.cache.get(channelID?.[1]);
    return channel?.isText()
      ? channel
      : null;
  },

  resolveChannelByQuery(query: string, guild: Guild): GuildTextBasedChannel {
    const queryLower = query.toLowerCase();
    return guild.channels.cache.array().find(
      (channel): channel is GuildTextBasedChannel => channel.isText() && channel.name.toLowerCase() === queryLower,
    );
  },

  resolveRoleByID(argument: string, guild: Guild): Role {
    const roleID = RoleMentionRegex.exec(argument) ?? SnowflakeRegex.exec(argument);
    return guild.roles.cache.get(roleID?.[1]);
  },

  resolveRoleByQuery(query: string, guild: Guild): Role {
    const queryLower = query.toLowerCase();
    return guild.roles.cache.find(role => role.name.toLowerCase() === queryLower);
  },

  async resolveMemberByID(argument: string, guild: Guild): Promise<GuildMember> {
    const memberID = UserOrMemberMentionRegex.exec(argument) ?? SnowflakeRegex.exec(argument);
    return guild.members.cache.get(memberID?.[1]) ?? await guild.members.fetch(memberID?.[1]).catch(nullop) ?? null;
  },

  resolveMemberByQuery(query: string, guild: Guild): GuildMember {
    const queryLower = query.toLowerCase();
    return guild.members.cache.find(member =>
      member.user.username.toLowerCase() === queryLower || member.displayName.toLowerCase() === queryLower);
  },

  async resolveMessageByID(argument: string, channel: GuildTextBasedChannel): Promise<GuildMessage> {
    const message = SnowflakeRegex.test(argument)
      ? await channel.messages.fetch(argument).catch(nullop) as GuildMessage
      : null;
    return message;
  },

  async resolveMessageByLink(argument: string, guild: Guild, user: User): Promise<GuildMessage> {
    const matches = MessageLinkRegex.exec(argument);
    if (!matches)
      return null;
    const [, guildID, channelID, messageID] = matches;

    if (guildID !== guild.id)
      return null;

    const channel = guild.channels.cache.get(channelID);
    if (!channel
      || !channel.viewable
      || !(isNewsChannel(channel) || isTextChannel(channel))
      || !channel.permissionsFor(user)?.has(Permissions.FLAGS.VIEW_CHANNEL))
      return null;

    const message = await channel.messages.fetch(messageID).catch(nullop) as GuildMessage;
    return message;
  },

  resolveDate(argument: string): Date {
    if (!DATE_REGEX.test(argument))
      return null;

    const groups = DATE_REGEX.exec(argument)?.groups;
    const date = new Date();
    date.setMonth(Number.parseInt(groups?.month, 10) - 1);
    date.setDate(Number.parseInt(groups?.day, 10));
    date.setHours(0, 0, 0, 0);

    const time = date.getTime();
    if (Number.isNaN(time))
      return null;

    return date;
  },

  resolveHour(argument: string): HourMinutes {
    const HOUR_REGEX = /^(?<hour>\d{1,2})[h:]?(?<minutes>\d{2})?$/imu;
    const hour = Number.parseInt(HOUR_REGEX.exec(argument)?.groups?.hour, 10);
    const minutes = Number.parseInt(HOUR_REGEX.exec(argument)?.groups?.minutes, 10) || 0;

    if (!hour)
      return null;

    return {
      hour,
      minutes,
      formatted: `${hour}h${minutes.toString().padStart(2, '0')}`,
    };
  },

  resolveDuration(argument: string): number {
    try {
      return getDuration(argument.replace(' ', ''));
    } catch {
      return null;
    }
  },
};
