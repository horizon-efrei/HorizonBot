import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import twemoji from 'twemoji';
import { eclass as config } from '@/config/commands/profs';
import settings from '@/config/settings';
import MonkaSubCommand from '@/structures/MonkaSubCommand';
import type { GuildMessage } from '@/types';
import { ConfigEntries } from '@/types/database';
import { capitalize, generateSubcommands } from '@/utils';

const EMOJI_URL_REGEX = /src="(?<url>.*)"/;

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  subCommands: generateSubcommands({
    create: { aliases: ['make', 'setup', 'add'] },
    start: { aliases: ['start'] },
    help: { default: true },
  }),
})
export default class EclassCommand extends MonkaSubCommand {
  public async create(message: GuildMessage, args: Args): Promise<void> {
    // Parse all arguments first
    // #region Arguments
    const classChannel = await args.pickResult('guildTextBasedChannel');
    if (classChannel.error) {
      await message.channel.send('Pas de channel.');
      return;
    }

    const topic = await args.pickResult('string');
    if (topic.error) {
      await message.channel.send('Pas de sujet.');
      return;
    }

    const date = await args.pickResult('date');
    if (date.error) {
      await message.channel.send('Pas de sujet.');
      return;
    }

    const hour = await args.pickResult('hour');
    if (hour.error) {
      await message.channel.send("Pas d'heure.");
      return;
    }

    const duration = await args.pickResult('hour');
    if (duration.error) {
      await message.channel.send('Pas de durée.');
      return;
    }

    const professor = await args.pickResult('member');
    if (professor.error) {
      await message.channel.send('Pas de prof.');
      return;
    }

    const targetRole = await args.pickResult('role');
    if (targetRole.error) {
      await message.channel.send('Pas de role.');
      return;
    }
    // #endregion Arguments

    date.value.setHours(hour.value.hour);
    date.value.setMinutes(hour.value.minutes);
    const formattedDate = dayjs(date.value).format('DD/MM [à] HH:mm');

    // All channels start with an emote followed by the subject's name
    const fullName = classChannel.value.name.split('-');
    const baseEmoji = fullName.shift();
    const subject = fullName.map(capitalize).join(' ');

    const image = EMOJI_URL_REGEX.exec(twemoji.parse(baseEmoji))?.groups?.url;
    const name = `${subject}: ${topic.value} (${formattedDate})`;

    const role = message.guild.roles.cache.find(r => r.name === name);
    if (role) {
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
      .setTitle(`${subject} - ${topic.value}`)
      .setDescription(`Un nouveau cours en **${subject}** a été planifié sur Ef'Réussite !`)
      .setThumbnail(image)
      .setAuthor("Ef'Réussite - Nouveau cours !", 'https://yt3.ggpht.com/ytc/AAUvwngHtCyPFpnVnqxb8JZRilKSen1ffGb1rxWsQywl=s176-c-k-c0x00ffffff-no-rj')
      .addField('Date et heure :', `${formattedDate}`)
      .addField('Durée :', duration.value.formatted)
      .addField('Professeur :', professor.value)
      .setFooter('Réagis avec ✔️ pour être notifié du cours !');

    const sentMessage = await channel.send(embed);
    await sentMessage.react('✅');

    await message.guild.roles.create({ data: { name, color: '#fff', mentionable: true } });
  }

  public async start(message: GuildMessage, args: Args): Promise<void> {
    const role = await args.pickResult('role');
    if (role.error) {
      await message.channel.send('Pas de role.');
      return;
    }

    const channel = await this.context.client.configManager.get(message.guild.id, ConfigEntries.ClassAnnoucement);
    await channel.send(`🔔 ${role.value} 🔔`);

    const embed = new MessageEmbed()
        .setColor('#00FFFF')
        .setTitle('Le cours va commencer !')
        .setThumbnail('https://yt3.ggpht.com/ytc/AAUvwngHtCyPFpnVnqxb8JZRilKSen1ffGb1rxWsQywl=s176-c-k-c0x00ffffff-no-rj')
        .setAuthor("Ef'Réussite")
        .setFooter("C'est maintenant 😊");
    await channel.send(embed).then(async sentMessage => sentMessage.react('🥳'));

    // TODO: Send messages to members in DM
  }

  public help(): void {
    console.log('help');
  }
}
