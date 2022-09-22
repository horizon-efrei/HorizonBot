import { TimestampStyles } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { userInfo as config } from '@/config/commands/general';
import settings from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Member = 'membre',
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class UserInfoCommand extends HorizonCommand<typeof config> {
    public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
      registry.registerChatInputCommand(
        command => command
          .setName(this.descriptions.name)
          .setDescription(this.descriptions.command)
          .setDMPermission(true)
          .addUserOption(
            option => option
              .setName(Options.Member)
              .setDescription(this.descriptions.options.member),
          ),
      );
    }

  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    const member = interaction.options.getMember(Options.Member) ?? interaction.member;

    const embedConfig = this.messages.embed;

    let presenceDetails = '';
    const activity = member.presence?.activities[0];
    if (activity) {
      presenceDetails = pupa(embedConfig.presence.types[activity.type], { activity });

      if (activity.details)
        presenceDetails += pupa(embedConfig.presence.details, { activity });

      if (activity.state)
        presenceDetails += pupa(embedConfig.presence.state, { activity });

      if (activity.timestamps?.start) {
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
      .addFields([
        { name: embedConfig.names.title, value: namesContent },
        { name: embedConfig.created.title, value: createdContent, inline: true },
        { name: embedConfig.joined.title, value: joinedContent, inline: true },
        { name: embedConfig.roles.title, value: rolesContent },
        { name: embedConfig.presence.title, value: presenceContent, inline: true },
      ]);

    await interaction.reply({ embeds: [embed] });
  }
}
