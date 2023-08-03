import { ApplyOptions } from '@sapphire/decorators';
import dayjs from 'dayjs';
import { EmbedBuilder } from 'discord.js';
import pupa from 'pupa';
import { statistics as config } from '@/config/commands/general';
import { settings } from '@/config/settings';
import pkg from '@/root/package.json';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';
import { getGitRev } from '@/utils';

@ApplyOptions<HorizonCommand.Options>(config)
export class StatisticsCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(true),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const embedMessages = this.messages.embed;
    const commitHash = await getGitRev();
    const embed = new EmbedBuilder()
      .setColor(settings.colors.default)
      .setDescription(this.messages.embed.description)
      .addFields([
        {
          name: embedMessages.version,
          value: pupa(embedMessages.versionContent, {
            version: pkg.version,
            commitLink: `[${commitHash.slice(0, 7)}](${pkg.repository.url}/commit/${commitHash})`,
          }),
          inline: true,
        },
        { name: embedMessages.memory, value: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} Mo`, inline: true },
        { name: embedMessages.uptime, value: dayjs.duration(this.container.client.uptime!).humanize(), inline: true },
        { name: embedMessages.maintainers, value: settings.maintainers.join('\n'), inline: true },
        { name: embedMessages.thanks, value: settings.thanks.join('\n'), inline: true },
      ])
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
