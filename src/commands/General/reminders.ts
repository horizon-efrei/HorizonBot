import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { DMChannel, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { reminders as config } from '@/config/commands/general';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Reminders from '@/models/reminders';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import type { GuildMessage } from '@/types';
import { generateSubcommands } from '@/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  subCommands: generateSubcommands({
    add: { aliases: ['create'] },
    list: { aliases: ['liste', 'show'] },
    remove: { aliases: ['delete', 'rm', 'rem', 'del'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class RemindersCommand extends HorizonSubCommand {
  public async add(message: GuildMessage, args: Args): Promise<void> {
    let date: number;
    try {
      date = await args.pick('duration')
        .then(duration => Date.now() + duration)
        .catch(async () => args.pick('date')
          .then(dat => dat.getTime()));
    } catch {
      await message.channel.send(config.messages.invalidTime);
      return;
    }

    const description = (await args.restResult('string'))?.value || messages.reminders.noDescription;

    const hasDmOpened = (await message.member.createDM()) instanceof DMChannel;

    const reminder = await Reminders.create({
      date,
      description,
      userId: message.author.id,
      guildId: message.guild.id,
    });
    await message.channel.send([
      pupa(config.messages.createdReminder, reminder.toJSON()),
      hasDmOpened ? '' : config.messages.openDm,
    ].filter(Boolean).join('\n'));
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const reminders = this.container.client.reminders.filter(rmd => rmd.userId === message.author.id);
    if (!reminders || reminders.size === 0) {
      await message.channel.send(config.messages.noReminders);
      return;
    }

    const embed = new MessageEmbed()
      .setTitle(pupa(config.messages.listEmbedTitle, { total: reminders.size }))
      .setDescription(
        reminders.map(rmd => pupa(config.messages.listEmbedItem, {
          ...rmd.toJSON(),
          timestamp: Math.round(rmd.date / 1000),
        })).join('\n'),
      );
    await message.channel.send({ embeds: [embed] });
  }

  public async remove(message: GuildMessage, args: Args): Promise<void> {
    const targetId = (await args.pickResult('string')).value
      || (await new ArgumentPrompter(message).promptText(config.messages.prompts.id)).split(' ').shift();

    const reminder = await Reminders.findOne({ reminderId: targetId, userId: message.author.id });
    if (!reminder) {
      await message.channel.send(config.messages.invalidReminder);
      return;
    }

    await reminder.remove();
    await message.channel.send(config.messages.removedReminder);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
