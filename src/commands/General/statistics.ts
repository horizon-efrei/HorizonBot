import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { statistics as config } from '@/config/commands/general';
import settings from '@/config/settings';
import pkg from '@/root/package.json';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import { getGitRev } from '@/utils';

@ApplyOptions<CommandOptions>(config.options)
export default class StatisticsCommand extends HorizonCommand {
  public async messageRun(message: Message): Promise<void> {
    const embedMessages = config.messages.embed;
    const commitHash = await getGitRev();
    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .setDescription(pupa(config.messages.embed.description, { prefix: settings.prefix }))
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
        { name: embedMessages.uptime, value: dayjs.duration(this.container.client.uptime).humanize(), inline: true },
        { name: embedMessages.maintainers, value: settings.maintainers.join('\n'), inline: true },
        { name: embedMessages.thanks, value: settings.thanks.join('\n'), inline: true },
      ])
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
}
