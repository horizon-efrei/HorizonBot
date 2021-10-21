import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { statistics as config } from '@/config/commands/general';
import settings from '@/config/settings';
import pkg from '@/root/package.json';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { getGitRev } from '@/utils';

@ApplyOptions<CommandOptions>(config.options)
export default class StatisticsCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage): Promise<void> {
    const embedMessages = config.messages.embed;
    const commitHash = await getGitRev();
    const embed = new MessageEmbed()
      .setColor(settings.colors.default)
      .setDescription(pupa(config.messages.embed.description, { prefix: settings.prefix }))
      .addField(
        embedMessages.version,
        pupa(embedMessages.versionContent, {
          version: pkg.version,
          commitLink: `[${commitHash.slice(0, 7)}](${pkg.repository.url}/commit/${commitHash})`,
        }),
        true,
      )
      .addField(embedMessages.memory, `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} Mo`, true)
      .addField(embedMessages.uptime, dayjs.duration(this.container.client.uptime).humanize(), true)
      .addField(embedMessages.maintainers, settings.maintainers.join('\n'), true)
      .addField(embedMessages.thanks, settings.thanks.join('\n'), true)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
}
