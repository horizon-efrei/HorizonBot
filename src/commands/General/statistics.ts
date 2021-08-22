import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { statistics as config } from '@/config/commands/general';
import settings from '@/config/settings';
import pkg from '@/root/package.json';
import MonkaCommand from '@/structures/commands/MonkaCommand';
import type { GuildMessage } from '@/types';
import { getGitRev } from '@/utils';

@ApplyOptions<CommandOptions>(config.options)
export default class StatisticsCommand extends MonkaCommand {
  public async run(message: GuildMessage): Promise<void> {
    const totalCommands = this.context.stores.get('commands').size;
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
      .addField(embedMessages.uptime, dayjs.duration(this.context.client.uptime).humanize(), true)
      .addField(embedMessages.commands, totalCommands.toString(), true)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
}
