import { Store } from '@sapphire/pieces';
import dayjs from 'dayjs';
import type { GuildMember, Role } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import twemoji from 'twemoji';
import { eclass as config } from '@/config/commands/professors';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import type { GuildMessage, GuildTextBasedChannel } from '@/types';
import type { EclassDocument } from '@/types/database';
import { ConfigEntries, EclassStatus } from '@/types/database';
import { capitalize, massSend, noop } from '@/utils';

const EMOJI_URL_REGEX = /src="(?<url>.*)"/;

const classAnnoucement: Record<SchoolYear, ConfigEntries> = {
  l1: ConfigEntries.ClassAnnoucementL1,
  l2: ConfigEntries.ClassAnnoucementL2,
  l3: ConfigEntries.ClassAnnoucementL3,
  general: ConfigEntries.ClassAnnoucementGeneral,
};

type SchoolYear = 'general' | 'l1' | 'l2' | 'l3';
interface EclassCreationOptions {
  date: Date;
  classChannel: GuildTextBasedChannel;
  topic: string;
  duration: number;
  professor: GuildMember;
  targetRole: Role;
}

interface EclassEmbedOptions {
  subject: string;
  topic: string;
  formattedDate: string;
  duration: number;
  professor: GuildMember;
  classChannel: GuildTextBasedChannel;
  classId: string;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class EclassManager {
  public static async createClass(
    message: GuildMessage,
    {
      date, classChannel, topic, duration, professor, targetRole,
    }: EclassCreationOptions,
  ): Promise<void> {
    // Prepare the date
    const formattedDate = dayjs(date).format(settings.configuration.dateFormat);

    // All channels start with an emote followed by the subject's name
    const fullName = classChannel.name.split('-');
    fullName.shift();
    const subject = fullName.map(capitalize).join(' ');
    const name = pupa(settings.configuration.eclassRoleFormat, { subject, topic, formattedDate });

    if (message.guild.roles.cache.some(r => r.name === name)) {
      await message.channel.send(config.messages.alreadyExists);
      return;
    }

    // Extract the school year from the category channel (L1, L2, L3...)
    const schoolYear = classChannel.parent.name.slice(-2).toLowerCase();
    const target: SchoolYear = Object.keys(classAnnoucement).includes(schoolYear) ? schoolYear as SchoolYear : 'general';

    // Get the corresponding annoucement channel
    const channel = await Store.injectedContext.client.configManager.get(message.guild.id, classAnnoucement[target]);

    if (!channel) {
      Store.injectedContext.logger.warn(`[e-class] A new e-class was planned but no annoucement channel was found, unable to create. Setup an annoucement channel with "${settings.prefix}setup class"`);
      await message.channel.send(config.messages.unconfiguredChannel);
      return;
    }

    // Create & send the announcement embed
    const embed = EclassManager.createAnnoucementEmbed({
      subject,
      topic,
      formattedDate,
      duration,
      professor,
      classChannel,
      classId: '',
    });
    const announcementMessage = await channel.send({
      content: pupa(config.messages.newClassNotification, { targetRole }),
      embed,
    });
    // Add the reaction & cache the message
    await announcementMessage.react(settings.emojis.yes);
    Store.injectedContext.client.eclassRolesIds.add(announcementMessage.id);

    // Create the role
    const role = await message.guild.roles.create({ data: { name, color: settings.colors.white, mentionable: true } });

    // Add the class to the database
    const eclass = await Eclass.create({
      classChannel: classChannel.id,
      guild: classChannel.guild.id,
      topic,
      subject,
      date: date.getTime(),
      duration,
      professor: professor.id,
      classRole: role.id,
      targetRole: targetRole.id,
      announcementMessage: announcementMessage.id,
      announcementChannel: classAnnoucement[target],
      classId: Eclass.generateId(topic, professor, date),
    });
    // Use the newly created ID in the embed
    await announcementMessage.edit({
      content: announcementMessage.content,
      embed: embed.setFooter(pupa(config.messages.newClassEmbed.footer, { eclass })),
    });

    // Send confirmation message
    await message.channel.send(pupa(config.messages.successfullyCreated, { eclass }));
  }

  public static async startClass(eclass: EclassDocument): Promise<void> {
    // Fetch the annoucement message
    const announcementChannel = await Store.injectedContext.client.configManager
      .get(eclass.guild, eclass.announcementChannel);
    const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);
    // Update its embed
    const announcementEmbed = announcementMessage.embeds[0];
    announcementEmbed.setColor(settings.colors.orange);
    announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date).value += ` ${config.messages.valueInProgress}`;
    await announcementMessage.edit(announcementEmbed);

    // Send an embed in the corresponding text channel
    const classChannel = Store.injectedContext.client
      .guilds.resolve(eclass.guild)
      .channels.resolve(eclass.classChannel) as GuildTextBasedChannel;
    const embed = new MessageEmbed()
      .setColor(settings.colors.primary)
      .setTitle(pupa(config.messages.startClassEmbed.title, { eclass }))
      .setAuthor(config.messages.startClassEmbed.author, announcementChannel.guild.iconURL())
      .setDescription(pupa(config.messages.startClassEmbed.description, { eclass }))
      .setFooter(pupa(config.messages.startClassEmbed.footer, { eclass }));
    await classChannel.send({
      content: pupa(config.messages.startClassNotification, { classRole: eclass.classRole }),
      embed,
    });

    // Mark the class as In Progress
    await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.InProgress });
  }

  public static async finishClass(eclass: EclassDocument): Promise<void> {
    // Fetch the annoucement message
    const announcementChannel = await Store.injectedContext.client.configManager
      .get(eclass.guild, eclass.announcementChannel);
    const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);
    // Update its embed
    const announcementEmbed = announcementMessage.embeds[0];
    const statusField = announcementEmbed.fields.find(field => field.name === config.messages.newClassEmbed.date);
    statusField.value = statusField.value.replace(config.messages.valueInProgress, config.messages.valueFinished);
    await announcementMessage.edit(announcementEmbed);

    // Remove the associated role
    await Store.injectedContext.client
      .guilds.cache.get(eclass.guild)
      .roles.cache.get(eclass.classRole)
      .delete('Class finished');

    // Mark the class as finished
    await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Finished });
  }

  public static async cancelClass(eclass: EclassDocument): Promise<void> {
    // Fetch the annoucement message
    const announcementChannel = await Store.injectedContext.client.configManager
      .get(eclass.guild, eclass.announcementChannel);
    const announcementMessage = await announcementChannel.messages.fetch(eclass.announcementMessage);
    // Update its embed
    const announcementEmbed = announcementMessage.embeds[0];
    announcementEmbed.setColor(settings.colors.red);
    announcementEmbed.setDescription(config.messages.valueCanceled);
    announcementEmbed.spliceFields(0, 25);
    await announcementMessage.edit(announcementEmbed);
    await announcementMessage.reactions.removeAll();
    // Remove from cache
    Store.injectedContext.client.eclassRolesIds.delete(announcementMessage.id);

    // Remove the associated role
    await Store.injectedContext.client
      .guilds.cache.get(eclass.guild)
      .roles.cache.get(eclass.classRole)
      .delete('Class canceled');

    // Mark the class as finished
    await Eclass.findByIdAndUpdate(eclass._id, { status: EclassStatus.Canceled });
  }

  public static async remindClass(eclass: EclassDocument): Promise<void> {
    // Resolve the associated channel
    const guild = Store.injectedContext.client.guilds.resolve(eclass.guild);
    const classChannel = guild.channels.resolve(eclass.classChannel) as GuildTextBasedChannel;
    // Send the notification
    await classChannel.send(
      pupa(config.messages.remindClassNotification, {
        classRole: eclass.classRole,
        duration: dayjs.duration(settings.configuration.eclassReminderTime).humanize(),
      }),
    );
    // Send the private message
    await massSend(guild, eclass.subscribers, pupa(config.messages.remindClassPrivateNotification, { eclass }));

    // Mark the reminder as sent
    await Eclass.findByIdAndUpdate(eclass._id, { reminded: true });
  }

  public static createAnnoucementEmbed({
    subject,
    topic,
    formattedDate,
    duration,
    professor,
    classChannel,
    classId,
  }: EclassEmbedOptions): MessageEmbed {
    const fullName = classChannel.name.split('-');
    const baseEmoji = fullName.shift();
    const image = EMOJI_URL_REGEX.exec(twemoji.parse(baseEmoji))?.groups?.url;

    const texts = config.messages.newClassEmbed;
    return new MessageEmbed()
      .setColor(settings.colors.green)
      .setTitle(pupa(texts.title, { subject, topic }))
      .setDescription(pupa(texts.description, { subject, classChannel }))
      .setThumbnail(image)
      .setAuthor(texts.author, classChannel.guild.iconURL())
      .addField(texts.date, formattedDate, true)
      .addField(texts.duration, dayjs.duration(duration).humanize(), true)
      .addField(texts.professor, professor, true)
      .setFooter(pupa(texts.footer, { classId }));
  }

  public static async subscribeMember(member: GuildMember, eclass: EclassDocument): Promise<void> {
    const givenRole = member.guild.roles.cache.get(eclass.classRole);
    if (!givenRole) {
      Store.injectedContext.logger.warn(`[e-class] The role with id ${eclass.classRole} does not exists !`);
      return;
    }

    await Eclass.findByIdAndUpdate(eclass._id, { $push: { subscribers: member.id } });
    if (!member.roles.cache.get(givenRole.id))
      await member.roles.add(givenRole);

    member.send(pupa(config.messages.subscribed, { subject: eclass.subject, topic: eclass.topic })).catch(noop);
  }

  public static async unsubscribeMember(member: GuildMember, eclass: EclassDocument): Promise<void> {
    const givenRole = member.guild.roles.cache.get(eclass.classRole);
    if (!givenRole) {
      Store.injectedContext.logger.warn(`[Reaction Roles] The role with id ${eclass.classRole} does not exists !`);
      return;
    }

    await Eclass.findByIdAndUpdate(eclass._id, { $pull: { subscribers: member.id } });
    if (member.roles.cache.get(givenRole.id))
      await member.roles.remove(givenRole);

    member.send(pupa(config.messages.unsubscribed, { subject: eclass.subject, topic: eclass.topic })).catch(noop);
  }
}
