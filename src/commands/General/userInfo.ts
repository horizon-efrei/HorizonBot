import { TimestampStyles } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { Formatters, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { userInfo as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class UserInfoCommand extends HorizonCommand {
  public override async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const member = await args.rest('member').catch(() => message.member);

    const embedConfig = config.messages.embed;

    let presenceDetails = '';
    const activity = member.presence?.activities[0];
    if (activity) {
      presenceDetails = pupa(embedConfig.presence.types[activity.type], { activity });

      if (activity.details)
        presenceDetails += pupa(embedConfig.presence.details, { activity });

      if (activity.state)
        presenceDetails += pupa(embedConfig.presence.state, { activity });

      if (activity.timestamps) {
        const time = Formatters.time(activity.timestamps.start, TimestampStyles.RelativeTime);
        presenceDetails += pupa(embedConfig.presence.timestamps, { time });
      }
    }

    const roles = [...member.roles.cache.values()].filter(role => role.name !== '@everyone');

    const presenceContent = pupa(embedConfig.presence.content, {
      status: embedConfig.presence.status[member.presence?.status ?? 'offline'],
      presenceDetails,
    });
    const namesContent = pupa(embedConfig.names.content, { member });
    const createdContent = pupa(embedConfig.created.content, {
      creation: Formatters.time(member.user.createdAt, Formatters.TimestampStyles.LongDateTime),
    });
    const joinedContent = pupa(embedConfig.joined.content,
      member.joinedTimestamp
        ? { joined: Formatters.time(new Date(member.joinedTimestamp), Formatters.TimestampStyles.LongDateTime) }
        : { joined: embedConfig.joined.unknown });
    const rolesContent = member.roles.cache.size === 1
      ? embedConfig.roles.noRole
      : pupa(embedConfig.roles.content, {
        amount: member.roles.cache.size - 1,
        roles: roles.join(', '),
      });

    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .setAuthor({ name: pupa(embedConfig.title, { member }) })
      .setThumbnail(member.user.displayAvatarURL())
      .addField(embedConfig.names.title, namesContent, false)
      .addField(embedConfig.created.title, createdContent, true)
      .addField(embedConfig.joined.title, joinedContent, true)
      .addField(embedConfig.roles.title, rolesContent, false)
      .addField(embedConfig.presence.title, presenceContent, true);

    await message.channel.send({ embeds: [embed] });
  }
}
