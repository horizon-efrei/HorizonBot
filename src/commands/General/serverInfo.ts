import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { Constants, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { serverInfo as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['GuildOnly'],
})
export default class ServerInfoCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage): Promise<void> {
    const texts = config.messages.embed;

    const embed = new MessageEmbed()
      .setColor(settings.colors.primary)
      .setTitle(pupa(texts.title, message.guild))
      .setThumbnail(message.guild.iconURL())
      .addFields([
        { name: texts.membersTitle, value: pupa(texts.membersValue, message.guild), inline: true },
        {
          name: texts.channelsTitle,
          value: pupa(texts.channelsValue, {
            ...message.guild,
            text: message.guild.channels.cache.filter(channel => channel.isText()).size,
            voice: message.guild.channels.cache.filter(channel => channel.isVoice()).size,
            categories: message.guild.channels.cache.filter(channel => channel.type === 'GUILD_CATEGORY').size,
          }),
          inline: true,
        },
        {
          name: texts.boostsTitle,
          value: pupa(texts.boostsValue, {
            ...message.guild,
            premiumTier: Constants.PremiumTiers[message.guild.premiumTier],
          }),
          inline: true,
        },
        { name: texts.rolesTitle, value: pupa(texts.rolesValue, message.guild), inline: true },
        {
          name: texts.createdAtTitle,
          value: pupa(texts.createdAtValue, {
            ...message.guild,
            createdTimestamp: Math.round(message.guild.createdTimestamp / 1000),
          }),
          inline: true,
        },
      ])
      .setFooter({ text: pupa(texts.footer, message.guild) });

    await message.channel.send({ embeds: [embed] });
  }
}
