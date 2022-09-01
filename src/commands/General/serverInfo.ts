import { ApplyOptions } from '@sapphire/decorators';
import { Constants, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { serverInfo as config } from '@/config/commands/general';
import settings from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

@ApplyOptions<HorizonCommand.Options>(config)
export default class ServerInfoCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    const texts = this.messages.embed;

    const embed = new MessageEmbed()
      .setColor(settings.colors.primary)
      .setTitle(pupa(texts.title, interaction.guild))
      .addFields([
        { name: texts.membersTitle, value: pupa(texts.membersValue, interaction.guild), inline: true },
        {
          name: texts.channelsTitle,
          value: pupa(texts.channelsValue, {
            ...interaction.guild,
            text: interaction.guild.channels.cache.filter(channel => channel.isText()).size,
            voice: interaction.guild.channels.cache.filter(channel => channel.isVoice()).size,
            categories: interaction.guild.channels.cache.filter(channel => channel.type === 'GUILD_CATEGORY').size,
          }),
          inline: true,
        },
        {
          name: texts.boostsTitle,
          value: pupa(texts.boostsValue, {
            ...interaction.guild,
            premiumTier: Constants.PremiumTiers[interaction.guild.premiumTier],
          }),
          inline: true,
        },
        { name: texts.rolesTitle, value: pupa(texts.rolesValue, interaction.guild), inline: true },
        {
          name: texts.createdAtTitle,
          value: pupa(texts.createdAtValue, {
            ...interaction.guild,
            createdTimestamp: Math.round(interaction.guild.createdTimestamp / 1000),
          }),
          inline: true,
        },
      ])
      .setFooter({ text: pupa(texts.footer, interaction.guild) });

    if (interaction.guild.iconURL())
      embed.setThumbnail(interaction.guild.iconURL()!);

    await interaction.reply({ embeds: [embed] });
  }
}
