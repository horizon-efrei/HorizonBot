import {
  ChannelMentionRegex,
  isNewsChannel,
  isTextChannel,
  MessageLinkRegex,
  RoleMentionRegex,
  SnowflakeRegex,
} from '@sapphire/discord.js-utilities';
import type { Guild, Role, User } from 'discord.js';
import { Permissions } from 'discord.js';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import { nullop } from '@/utils';

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
};
