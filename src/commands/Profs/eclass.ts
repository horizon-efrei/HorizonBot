import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import dayjs from 'dayjs';
import { MessageEmbed } from 'discord.js';
import twemoji from 'twemoji';
import settings from '@/config/settings';
import { eclass as config } from '@/config/commands/profs';
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
    const classChannel = await args.pickResult('guildTextBasedChannel');
    if (classChannel.error) {
      await message.channel.send('Pas de channel.');
      return;
    }

    const subject = await args.pickResult('string');
    if (subject.error) {
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

    const prof = await args.pickResult('member');
    if (prof.error) {
      await message.channel.send('Pas de prof.');
      return;
    }

    const targetRole = await args.pickResult('role');
    if (targetRole.error) {
      await message.channel.send('Pas de role.');
      return;
    }

    date.value.setHours(hour.value.hour);
    date.value.setMinutes(hour.value.minutes);
    const formattedDate = dayjs(date.value).format('DD/MM [à] HH:mm');

    const fullName = classChannel.value.name.split('-');
    const baseEmoji = fullName.shift();
    const matiere = fullName.map(capitalize).join(' ');

    const image = EMOJI_URL_REGEX.exec(twemoji.parse(baseEmoji) as string)?.groups?.url;
    const name = `${matiere}: ${subject.value} (${formattedDate})`;

    const role = message.guild.roles.cache.find(r => r.name === name);
    if (role) {
      await message.channel.send('Désolé mais ce cours semble déjà être prévu 😭');
      return;
    }

    const channel = await this.context.client.configManager.get(message.guild.id, ConfigEntries.ClassAnnoucement);
    await message.channel.send('Le cours a été créé ! 😊');

    const embed = new MessageEmbed()
      .setColor(settings.colors.green)
      .setTitle(`${matiere} - ${subject.value}`)
      .setDescription(`Un nouveau cours en **${matiere}** a été planifié sur Ef'Réussite !`)
      .setThumbnail(image)
      .setAuthor("Ef'Réussite - Nouveau cours !", 'https://yt3.ggpht.com/ytc/AAUvwngHtCyPFpnVnqxb8JZRilKSen1ffGb1rxWsQywl=s176-c-k-c0x00ffffff-no-rj')
      .addField('Date et heure :', `${formattedDate}`)
      .addField('Durée :', `${duration.value.hour}h${duration.value.minutes.toString().padStart(2, '0')}`)
      .addField('Professeur :', prof.value)
      .setFooter('Réagis avec ✔️ pour être notifié du cours !');

      await channel.send(embed).then(async sentMessage => sentMessage.react('✅'));

    await message.guild.roles.create({
      data: { name, color: 'WHITE' },
    });
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
