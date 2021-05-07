import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import dayjs from 'dayjs';
import type { GuildMember, Role } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import twemoji from 'twemoji';
import { eclass as config } from '@/config/commands/professors';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import MonkaSubCommand from '@/structures/MonkaSubCommand';
import type { GuildMessage, GuildTextBasedChannel, HourMinutes } from '@/types';
import { ConfigEntries, EclassStatus } from '@/types/database';
import { capitalize, generateSubcommands, nullop } from '@/utils';

const EMOJI_URL_REGEX = /src="(?<url>.*)"/;

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  subCommands: generateSubcommands({
    create: { aliases: ['add'] },
    setup: { aliases: ['build', 'make'] },
    start: { aliases: ['begin'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class EclassCommand extends MonkaSubCommand {
  public async create(message: GuildMessage, args: Args): Promise<void> {
    if (!message.member.roles.cache.has(settings.roles.eprof)) {
      await message.channel.send(config.messages.onlyProfessor);
      return;
    }

    const classChannel = await args.pickResult('guildTextBasedChannel');
    if (classChannel.error) {
      await message.channel.send(config.messages.prompts.classChannel.invalid);
      return;
    }

    const topic = await args.pickResult('string');
    if (topic.error) {
      await message.channel.send(config.messages.prompts.topic.invalid);
      return;
    }

    const date = await args.pickResult('date');
    if (date.error) {
      await message.channel.send(config.messages.prompts.date.invalid);
      return;
    }

    const hour = await args.pickResult('hour');
    if (hour.error) {
      await message.channel.send(config.messages.prompts.hour.invalid);
      return;
    }

    const duration = await args.pickResult('duration');
    if (duration.error) {
      await message.channel.send(config.messages.prompts.duration.invalid);
      return;
    }

    const professor = await args.pickResult('member');
    if (professor.error) {
      await message.channel.send(config.messages.prompts.professor.invalid);
      return;
    }

    const targetRole = await args.pickResult('role');
    if (targetRole.error) {
      await message.channel.send(config.messages.prompts.targetRole.invalid);
      return;
    }

    await this._createClass(message, {
      date: date.value,
      hour: hour.value,
      classChannel: classChannel.value,
      topic: topic.value,
      duration: duration.value,
      professor: professor.value,
      targetRole: targetRole.value,
    });
  }

  public async setup(message: GuildMessage): Promise<void> {
    if (!message.member.roles.cache.has(settings.roles.eprof)) {
      await message.channel.send(config.messages.onlyProfessor);
      return;
    }

    let classChannel: GuildTextBasedChannel;
    let topic: string;
    let date: Date;
    let hour: HourMinutes;
    let duration: number;
    let professor: GuildMember;
    let targetRole: Role;

    try {
      const allMessages: GuildMessage[] = [];
      const prompter = new ArgumentPrompter(message, allMessages);

      classChannel = await prompter.autoPromptTextChannel(config.messages.prompts.classChannel);
      topic = await prompter.autoPromptText(config.messages.prompts.topic);
      date = await prompter.autoPromptDate(config.messages.prompts.date);
      hour = await prompter.autoPromptHour(config.messages.prompts.hour);
      duration = await prompter.autoPromptDuration(config.messages.prompts.duration);
      professor = await prompter.autoPromptMember(config.messages.prompts.professor);
      targetRole = await prompter.autoPromptRole(config.messages.prompts.targetRole);
    } catch (error: unknown) {
      if ((error as Error).message === 'STOP') {
        await message.channel.send(messages.prompts.stoppedPrompting);
        return;
      }
      throw error;
    }

    await this._createClass(message, {
      date,
      hour,
      classChannel,
      topic,
      duration,
      professor,
      targetRole,
    });
  }

  public async start(message: GuildMessage, args: Args): Promise<void> {
    const role = await args.pickResult('role');
    if (role.error) {
      await message.channel.send(config.messages.prompts.targetRole.invalid);
      return;
    }

    const eclass = await Eclass.findOneAndUpdate({ classRole: role.value.id }, { status: EclassStatus.InProgress });
    const professor = await message.guild.members.fetch(eclass.professor).catch(nullop);
    if (!professor) {
      await message.channel.send(config.messages.unresolvedProfessor);
      return;
    }
    if (message.author.id !== professor.id) {
      await message.channel.send(pupa(config.messages.notOriginalProfessor, { professor }));
      return;
    }

    const announcementChannel = await this.context.client.configManager
      .get(message.guild.id, ConfigEntries.ClassAnnoucement);
    await announcementChannel.send(`🔔 ${role.value} 🔔`);

    const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);
    const announcementEmbed = announcementMessage.embeds[0];
    announcementEmbed.setColor(settings.colors.orange);
    announcementEmbed.fields.find(field => field.name === 'Date et heure :').value += ' [En cours]';
    await announcementMessage.edit(announcementEmbed);

    const embed = new MessageEmbed()
      .setColor('#5bb78f')
      .setTitle(`Le cours en ${eclass.subject} va commencer !`)
      .setAuthor("Ef'Réussite - Un cours commence !", 'https://yt3.ggpht.com/ytc/AAUvwngHtCyPFpnVnqxb8JZRilKSen1ffGb1rxWsQywl=s176-c-k-c0x00ffffff-no-rj')
      .setDescription(`Le cours en **${eclass.subject}** sur "**${eclass.topic}**" présenté par ${professor} commence :) Le salon textuel associé est <#${eclass.textChannel}>`)
      .setFooter("C'est maintenant 😊");
    await announcementChannel.send(embed);

    await message.channel.send('Le cours à bien été lancé !');
    // TODO: Send messages to members in DM
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send(embed);
  }

  private async _createClass(
    message: GuildMessage,
    {
      date, hour, classChannel, topic, duration, professor, targetRole,
    }: {
      date: Date;
      hour: HourMinutes;
      classChannel: GuildTextBasedChannel;
      topic: string;
      duration: number;
      professor: GuildMember;
      targetRole: Role;
    },
  ): Promise<void> {
    date.setHours(hour.hour);
    date.setMinutes(hour.minutes);
    const formattedDate = dayjs(date).format('DD/MM [à] HH:mm');

    // All channels start with an emote followed by the subject's name
    const fullName = classChannel.name.split('-');
    const baseEmoji = fullName.shift();
    const subject = fullName.map(capitalize).join(' ');

    const image = EMOJI_URL_REGEX.exec(twemoji.parse(baseEmoji))?.groups?.url;
    const name = `${subject}: ${topic} (${formattedDate})`;

    if (message.guild.roles.cache.some(r => r.name === name)) {
      await message.channel.send('Désolé mais ce cours semble déjà être prévu 😭');
      return;
    }

    const channel = await this.context.client.configManager.get(message.guild.id, ConfigEntries.ClassAnnoucement);
    if (!channel) {
      this.context.logger.warn(`[e-class] A new e-class was planned but no annoucement channel was found, unable to create. Setup an annoucement channel with "${settings.prefix}setup class"`);
      await message.channel.send(`Oups, impossible de créer ce cours car aucun salon n'a été configuré pour les annonces. Configurez-en un en écrivant \`${settings.prefix}setup class\` dans le bon salon.`);
      return;
    }
    await message.channel.send('Le cours a été créé ! 😊');

    const embed = new MessageEmbed()
      .setColor(settings.colors.green)
      .setTitle(`${subject} - ${topic}`)
      .setDescription(`Un nouveau cours en **${subject}** a été planifié sur Ef'Réussite !`)
      .setThumbnail(image)
      .setAuthor("Ef'Réussite - Nouveau cours !", 'https://yt3.ggpht.com/ytc/AAUvwngHtCyPFpnVnqxb8JZRilKSen1ffGb1rxWsQywl=s176-c-k-c0x00ffffff-no-rj')
      .addField('Date et heure :', formattedDate)
      .addField('Durée :', dayjs.duration(duration * 1000).humanize())
      .addField('Professeur :', professor)
      .setFooter('Réagis avec :white_check_mark: pour être notifié du cours !');
    const announcementMessage = await channel.send(embed);
    await announcementMessage.react('✅');

    const role = await message.guild.roles.create({ data: { name, color: '#ffffff', mentionable: true } });

    await Eclass.create({
      textChannel: classChannel.id,
      guild: classChannel.guild.id,
      topic,
      subject,
      date: date.getTime(),
      duration,
      professor: professor.id,
      classRole: role.id,
      targetRole: targetRole.id,
      announcementMessage: announcementMessage.id,
    });
  }
}