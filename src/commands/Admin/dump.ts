import { ApplyOptions } from '@sapphire/decorators';
import { MessageLimits } from '@sapphire/discord-utilities';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Resolvers } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import pupa from 'pupa';
import { dump as config } from '@/config/commands/admin';
import messages from '@/config/messages';
import settings from '@/config/settings';
import { resolveCompleteEmoji } from '@/resolvers';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { nullop } from '@/utils';

function memberSorterFactory(order: string): (a: GuildMember, b: GuildMember) => number {
  return (a, b): number => {
    switch (order) {
      case 'name':
        return a.user.username.localeCompare(b.user.username);
      case 'id':
        return a.id.localeCompare(b.id);
      case 'created':
        return a.user.createdTimestamp - b.user.createdTimestamp;
      case 'joined':
        return a.joinedTimestamp - b.joinedTimestamp;
      case 'nick':
        return a.nickname?.localeCompare(b.nickname) ?? 0;
      default:
        return 0;
    }
  };
}

function memberFormatterFactory(format: string, dateFormat: string): (member: GuildMember) => string {
  return (member): string => pupa(format, {
    u: member.user.tag,
    n: member.displayName,
    i: member.id,
    c: dayjs(member.user.createdAt).format(dateFormat),
    j: dayjs(member.joinedAt).format(dateFormat),
  });
}

const dumpOptions = {
  format: ['format', 'f'],
  allRole: ['has-all-roles', 'a'],
  role: ['has-roles', 'h'],
  reacted: ['reacted', 'r'],
  order: ['order', 'o'],
  limit: ['limit', 'l'],
  separator: ['separator', 's'],
  dateFormat: ['dateformat', 'df'],
};

const dumpFlags = {
  descending: ['desc', 'd'],
  noRole: ['no-roles', 'n'],
  enumerate: ['enumerate', 'e'],
  dm: ['dm', 'mp'],
};

@ApplyOptions<CommandOptions>({
  ...config.options,
  flags: Object.values(dumpFlags).flat(),
  options: Object.values(dumpOptions).flat(),
  preconditions: ['GuildOnly', 'StaffOnly'],
})
export default class DumpCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    let members = await message.guild.members.fetch();

    // Keeps members who have at least one of the specified roles
    const roleFilter = args.getOption(...dumpOptions.role)?.split(',');
    if (roleFilter?.length > 0) {
      members = members.filter(
        member => member.roles.cache.some(role => roleFilter.includes(role.id) || roleFilter.includes(role.name)),
      );
    }

    // Keeps members who have all of the specified roles
    const allRoleFilter = args.getOption(...dumpOptions.allRole)?.split(',');
    if (allRoleFilter?.length > 0) {
      members = members.filter(
        member => allRoleFilter.every(
          queriedRole => member.roles.cache.has(queriedRole) || member.roles.cache.find(r => r.name === queriedRole),
        ),
      );
    }

    // Keeps members who don't have any roles at all (except for @everyone)
    const noRoleFilter = args.getFlags(...dumpFlags.noRole);
    if (noRoleFilter)
      members = members.filter(member => member.roles.cache.size === 1);

    // Keeps members who reacted to the message
    const reactionFilter = args.getOption(...dumpOptions.reacted);
    if (reactionFilter) {
      const [reactionResolvable, reactedMessageResolvable] = reactionFilter.split('@');
      if (reactionResolvable && reactedMessageResolvable) {
        const reaction = resolveCompleteEmoji(reactionResolvable, message.guild);
        const reactedMessage = await Resolvers.resolveMessage(reactedMessageResolvable, { message });
        if (reactedMessage.success) {
          const emojiKey = typeof reaction.value === 'string' ? reaction.value : reaction.value.id;
          const reactionners = reactedMessage.value.reactions.cache.get(emojiKey).users.cache;
          members = members.filter(member => reactionners.has(member.id));
        }
      }
    }

    // Sorts the members as asked (name, id, created_at, joined_at, nick)
    const order = args.getOption(...dumpOptions.order);
    if (order) {
      const sorter = memberSorterFactory(order);
      members.sort(sorter);
    }

    // Keeps only the specified number of members
    const limitRaw = args.getOption(...dumpOptions.limit);
    const limit = Number(limitRaw);
    if (limit && !Number.isNaN(limit)) {
      let i = 0;
      members = members.filter(() => i++ < limit);
    }

    // Formats the members as asked
    const format = args.getOption(...dumpOptions.format);
    const dateFormat = args.getOption(...dumpOptions.dateFormat) ?? settings.configuration.dateFormat;
    const formatter = memberFormatterFactory(format ?? '{u} ({i})', dateFormat);
    let formattedMembers = members.map(formatter);

    // Reverse the order if asked
    const desc = args.getFlags(...dumpFlags.descending);
    if (desc)
      formattedMembers.reverse();

    // Enumerates the members if asked
    const enumerate = args.getFlags(...dumpFlags.enumerate);
    if (enumerate)
      formattedMembers = formattedMembers.map((member, i) => `${i + 1}. ${member}`);

    // Joins the members together with the specified separator
    const separator = args.getOption(...dumpOptions.separator) ?? '\n';
    if (formattedMembers.length === 0) {
      await message.channel.send(config.messages.noMatchFound);
      return;
    }

    const output = formattedMembers.join(separator);
    const payload = output.length > MessageLimits.MaximumLength
      ? { files: [{ attachment: Buffer.from(output), name: 'dump.txt' }] }
      : output;

    if (args.getFlags(...dumpFlags.dm)) {
      try {
        await message.member.send(payload);
        await message.react(settings.emojis.yes).catch(nullop);
      } catch {
        await message.channel.send(messages.global.dmFailed);
      }
    } else {
      await message.channel.send(payload);
    }
  }
}
