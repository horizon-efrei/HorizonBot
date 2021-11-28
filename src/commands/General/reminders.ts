import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import { Args } from '@sapphire/framework';
import { DMChannel, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { commonSubcommands } from '@/app/lib/utils/generateSubcommands';
import { reminders as config } from '@/config/commands/general';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Reminders from '@/models/reminders';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import type { ReminderBase } from '@/types/database';

enum Subcommand {
  Create = 'create',
  List = 'list',
  Remove = 'remove',
  Help = 'help',
}

@ApplyOptions<CommandOptions>(config.options)
export default class RemindersCommand extends HorizonCommand {
  private static readonly _action = Args.make<Subcommand>((parameter, { argument }) => {
    const query = parameter.toLowerCase();
    if (commonSubcommands.list.aliases.includes(query))
      return Args.ok(Subcommand.List);
    if (commonSubcommands.remove.aliases.includes(query))
      return Args.ok(Subcommand.Remove);
    if (commonSubcommands.create.aliases.includes(query))
      return Args.ok(Subcommand.Create);
    if (commonSubcommands.help.aliases.includes(query))
      return Args.ok(Subcommand.Help);
    return Args.error({ argument, parameter });
  });

  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const action = args.finished
      ? Subcommand.List
      : await args.pick(RemindersCommand._action).catch(() => Subcommand.Create);
    await this[action](message, args);
  }

  public async create(message: GuildMessage, args: Args): Promise<void> {
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

    const reminder = await Reminders.create({
      date,
      description: (await args.restResult('string'))?.value || messages.reminders.noDescription,
      userId: message.author.id,
      guildId: message.guild.id,
    });

    const hasDmOpened = (await message.member.createDM()) instanceof DMChannel;
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

    await new PaginatedFieldMessageEmbed<ReminderBase & { timestamp: number }>()
      .setTitleField(pupa(config.messages.listTitle, { total: reminders.size }))
      .setTemplate(new MessageEmbed().setColor(settings.colors.default))
      .setItems([...reminders.map(rmd => ({ ...rmd.toJSON(), timestamp: Math.round(rmd.date / 1000) }))])
      .formatItems(item => pupa(config.messages.listLine, item))
      .setItemsPerPage(10)
      .make()
      .run(message);
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
