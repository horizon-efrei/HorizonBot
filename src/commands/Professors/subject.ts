import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';

import { subject as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import { IsEprofOrStaff } from '@/decorators';
import SubjectInteractiveBuilder from '@/eclasses/SubjectInteractiveBuilder';
import Eclass from '@/models/eclass';
import Subject from '@/models/subject';
import PaginatedMessageEmbedFields from '@/structures/PaginatedMessageEmbedFields';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import { GuildMessage } from '@/types';
import type { SubjectDocument } from '@/types/database';
import { generateSubcommands } from '@/utils';


@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  subCommands: generateSubcommands(['create', 'remove', 'list', 'help']),
})
export default class SubjectCommand extends HorizonSubCommand {
  @IsEprofOrStaff()
  public async create(message: GuildMessage, _args: Args): Promise<void> {
    const responses = await new SubjectInteractiveBuilder(message).start();
    if (!responses)
      return;

    await Subject.create({
      ...responses,
      textChannel: responses.textChannel.id,
      textDocsChannel: responses.textDocsChannel?.id,
      voiceChannel: responses.voiceChannel?.id,
    });
    await message.channel.send(config.messages.successfullyCreated);
  }

  @IsEprofOrStaff()
  public async remove(message: GuildMessage, args: Args): Promise<void> {
    const classCode = await args.pickResult('string');
    if (classCode.error) {
      await message.channel.send(config.messages.invalidCode);
      return;
    }

    const subject = await Subject.findOne({ classCode: classCode.value });
    if (!subject) {
      await message.channel.send(config.messages.unknownSubject);
      return;
    }

    const eclassesInUse = await Eclass.find({ subject: subject._id });
    if (eclassesInUse.length > 0) {
      await message.channel.send(pupa(config.messages.removalFailed, { amount: eclassesInUse.length }));
      return;
    }

    await subject.remove();
    await message.channel.send(config.messages.successfullyRemoved);
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const subjects: SubjectDocument[] = await Subject.find();

    const baseEmbed = new MessageEmbed()
      .setTitle(config.messages.listTitle)
      .setColor(settings.colors.default);

    if (subjects.length === 0) {
      await message.channel.send({ embeds: [baseEmbed.setDescription(config.messages.noSubjectFound)] });
      return;
    }

    await new PaginatedMessageEmbedFields()
      .setTemplate(baseEmbed.setDescription(config.messages.someSubjectsFound(subjects.length)))
      .setItems(
        subjects.map(subject => ({
          name: pupa(config.messages.listFieldTitle, subject),
          value: pupa(config.messages.listFieldDescription, {
            ...subject.toJSON(),
            channels: [subject.textChannel, subject.textDocsChannel, subject.voiceChannel]
              .map(channel => (channel ? `<#${channel}>` : 'N/A'))
              .join(' • '),
          }),
        })),
      )
      .setItemsPerPage(4)
      .make()
      .run(message, message.author);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }
}
