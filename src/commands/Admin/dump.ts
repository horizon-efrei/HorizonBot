import { userMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageLimits } from '@sapphire/discord-utilities';
import { Resolvers } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { GuildMember } from 'discord.js';
import { Permissions } from 'discord.js';
import pupa from 'pupa';
import { dump as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import { resolveCompleteEmoji } from '@/resolvers';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Format = 'format',
  HasAllRoles = 'a-tous-les-roles',
  HasRoles = 'a-un-des-roles',
  Reacted = 'a-reagis',
  Order = 'ordre',
  Limit = 'limite',
  Separator = 'separateur',
  DateFormat = 'format-date',
  Sort = 'tri',
  NoRoles = 'aucun-role',
  Enumerate = 'enumerer',
  Private = 'privé',
}

enum OptionOrderChoices {
  Name = 'nom',
  Id = 'id',
  Created = 'creation-compte',
  Joined = 'arrivee-guilde',
  Nick = 'surnom',
}

enum OptionSortChoices {
  Asc = 'asc',
  Desc = 'desc',
}

function memberSorterFactory(order: OptionOrderChoices): (a: GuildMember, b: GuildMember) => number {
  return (a, b): number => {
    switch (order) {
      case OptionOrderChoices.Name:
        return a.user.username.localeCompare(b.user.username);
      case OptionOrderChoices.Id:
        return a.id.localeCompare(b.id);
      case OptionOrderChoices.Created:
        return a.user.createdTimestamp - b.user.createdTimestamp;
      case OptionOrderChoices.Joined:
        return Math.max((a.joinedTimestamp ?? 0) - (b.joinedTimestamp ?? 0), 0);
      case OptionOrderChoices.Nick:
        return a.displayName?.localeCompare(b.displayName) ?? 0;
    }
  };
}

function memberFormatterFactory(format: string, dateFormat: string): (member: GuildMember) => string {
  return (member): string => pupa(format, {
    u: member.user.tag,
    m: userMention(member.id),
    n: member.displayName,
    i: member.id,
    c: dayjs(member.user.createdAt).format(dateFormat),
    j: dayjs(member.joinedAt).format(dateFormat),
  });
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class DumpCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(false)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD)
        .addStringOption(
          option => option
            .setName(Options.Format)
            .setDescription(this.descriptions.options.format),
        )
        .addStringOption(
          option => option
            .setName(Options.HasAllRoles)
            .setDescription(this.descriptions.options.hasAllRoles),
        )
        .addStringOption(
          option => option
            .setName(Options.HasRoles)
            .setDescription(this.descriptions.options.hasRoles),
        )
        .addStringOption(
          option => option
            .setName(Options.Reacted)
            .setDescription(this.descriptions.options.reacted),
        )
        .addStringOption(
          option => option
            .setName(Options.Order)
            .setDescription(this.descriptions.options.order)
            .setChoices(
              { name: "nom d'utilisateur", value: OptionOrderChoices.Name },
              { name: 'identifiant', value: OptionOrderChoices.Id },
              { name: 'date de création du compte', value: OptionOrderChoices.Created },
              { name: "date d'arrivée sur le serveur", value: OptionOrderChoices.Joined },
              { name: 'pseudo', value: OptionOrderChoices.Nick },
            ),
        )
        .addIntegerOption(
          option => option
            .setName(Options.Limit)
            .setDescription(this.descriptions.options.limit).setMinValue(1),
        )
        .addStringOption(
          option => option
            .setName(Options.Separator)
            .setDescription(this.descriptions.options.separator),
        )
        .addStringOption(
          option => option
            .setName(Options.DateFormat)
            .setDescription(this.descriptions.options.dateFormat),
        )
        .addStringOption(
          option => option
            .setName(Options.Sort)
            .setDescription(this.descriptions.options.sort)
            .setChoices(
              { name: 'ascendant', value: OptionSortChoices.Asc },
              { name: 'descendant', value: OptionSortChoices.Desc },
            ),
        )
        .addBooleanOption(
          option => option
            .setName(Options.NoRoles)
            .setDescription(this.descriptions.options.noRoles),
        )
        .addBooleanOption(
          option => option
            .setName(Options.Enumerate)
            .setDescription(this.descriptions.options.enumerate),
        )
        .addBooleanOption(
          option => option
            .setName(Options.Private)
            .setDescription(this.descriptions.options.private),
        ),
    );
  }

  // eslint-disable-next-line complexity
  public override async chatInputRun(interaction: HorizonCommand.ChatInputInteraction<'cached'>): Promise<void> {
    let members = await interaction.guild.members.fetch();

    // Keeps members who have at least one of the specified roles
    const roleFilter = interaction.options.getString(Options.HasRoles);
    if (roleFilter) {
      const roles = [...roleFilter.matchAll(/<@&(?<id>\d{17,20})>/g)].map(match => match.groups!.id);
      if (roles.length > 0) {
        members = members.filter(
          member => roles.some(role => member.roles.cache.has(role)),
        );
      }
    }

    // Keeps members who have all the specified roles
    const allRoleFilter = interaction.options.getString(Options.HasAllRoles);
    if (allRoleFilter) {
      const roles = [...allRoleFilter.matchAll(/<@&(?<id>\d{17,20})>/g)].map(match => match.groups!.id);
      if (roles.length > 0) {
        members = members.filter(
          member => roles.every(role => member.roles.cache.has(role)),
        );
      }
    }

    // Keeps members who don't have any roles at all (except for @everyone)
    const noRoleFilter = interaction.options.getBoolean(Options.NoRoles);
    if (noRoleFilter)
      members = members.filter(member => member.roles.cache.size === 1);

    // Keeps members who reacted to the message
    const reactionFilter = interaction.options.getString(Options.Reacted);
    if (reactionFilter) {
      const [reactionResolvable, reactedMessageResolvable] = reactionFilter.split('@');
      if (reactionResolvable && reactedMessageResolvable) {
        const emoji = resolveCompleteEmoji(reactionResolvable, interaction.guild);
        const reactedMessage = await Resolvers.resolveMessage(
          reactedMessageResolvable,
          { messageOrInteraction: interaction },
        );

        if (reactedMessage.isOk() && emoji.isOk()) {
          const emojiKey = emoji.map(value => (typeof value === 'string' ? value : value.id)).unwrap();
          const reaction = reactedMessage.unwrap().reactions.cache.get(emojiKey);

          if (reaction) {
            const reactionners = await reaction.users.fetch();
            members = members.filter(member => reactionners.has(member.id));
          } else {
            await interaction.reply({ content: this.messages.noMatchFound, ephemeral: true });
            return;
          }
        }
      } else if (reactionResolvable && !reactedMessageResolvable) {
        // In this case, reactionResolvable is actually not a reaction, but a message
        const reactedMessage = await Resolvers.resolveMessage(
          reactionResolvable,
          { messageOrInteraction: interaction },
        );

        if (reactedMessage.isOk()) {
          const usersByReaction = await Promise.all(
            reactedMessage.unwrap().reactions.cache.mapValues(async reaction => reaction.users.fetch()).values(),
          );
          const reactionners = new Set(usersByReaction.flatMap(r => [...r.values()]).map(r => r.id));
          members = members.filter(member => reactionners.has(member.id));
        }
      }
    }

    // Sorts the members as asked (name, id, created_at, joined_at, nick)
    const order = interaction.options.getString(Options.Order) as OptionOrderChoices;
    if (order) {
      const sorter = memberSorterFactory(order);
      members.sort(sorter);
    }

    // Keeps only the specified number of members
    const limitRaw = interaction.options.getInteger(Options.Limit);
    const limit = Number(limitRaw);
    if (limit && !Number.isNaN(limit)) {
      let i = 0;
      members = members.filter(() => i++ < limit);
    }

    // Formats the members as asked
    const format = interaction.options.getString(Options.Format);
    const dateFormat = interaction.options.getString(Options.DateFormat) ?? settings.configuration.dateFormat;
    const formatter = memberFormatterFactory(format ?? '{u} ({i})', dateFormat);
    let formattedMembers = members.map(formatter);

    // Reverse the order if asked
    const desc = (interaction.options.getString(Options.Sort) as OptionSortChoices | null) === OptionSortChoices.Desc;
    if (desc)
      formattedMembers.reverse();

    // Enumerates the members if asked
    const enumerate = interaction.options.getBoolean(Options.Enumerate);
    if (enumerate)
      formattedMembers = formattedMembers.map((member, i) => `${i + 1}. ${member}`);

    if (formattedMembers.length === 0) {
      await interaction.reply({ content: this.messages.noMatchFound, ephemeral: true });
      return;
    }

    // Joins the members together with the specified separator
    const separator = interaction.options.getString(Options.Separator) ?? '\n';

    const output = formattedMembers.join(separator);
    const payload = output.length > MessageLimits.MaximumLength
      ? { files: [{ attachment: Buffer.from(output), name: 'dump.txt' }] }
      : { content: output };

    await interaction.reply({
      ...payload,
      ephemeral: interaction.options.getBoolean(Options.Private) ?? false,
    });
  }
}
