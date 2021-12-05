/* eslint-disable @typescript-eslint/member-ordering */
import { roleMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedLimits } from '@sapphire/discord-utilities';
import type { IMessagePrompterExplicitConfirmReturn } from '@sapphire/discord.js-utilities';
import { MessagePrompter } from '@sapphire/discord.js-utilities';
import { Args, Resolvers } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import type { MessageOptions } from 'discord.js';
import { MessageEmbed, Role } from 'discord.js';
import difference from 'lodash.difference';
import pupa from 'pupa';
import PaginatedMessageEmbedFields from '@/app/lib/structures/PaginatedMessageEmbedFields';
import { reactionRole as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import { ResolveReactionRoleArgument } from '@/decorators';
import ReactionRole from '@/models/reactionRole';
import * as CustomResolvers from '@/resolvers';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import { GuildMessage } from '@/types';
import type { GuildTextBasedChannel, ReactionRolePair, ReactionRoleReturnPayload } from '@/types';
import type { ReactionRoleDocument } from '@/types/database';
import {
  firstAndRest,
  generateSubcommands,
  nullop,
  trimText,
} from '@/utils';

interface ExtraContext {
  document?: ReactionRoleDocument;
  rrMessage: GuildMessage;
}

const uniqueFlags = ['unique', 'u'];

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  preconditions: ['StaffOnly'],
  flags: [...uniqueFlags],
  subCommands: generateSubcommands(['create', 'edit', 'help', 'list', 'remove'], {
    addPair: { aliases: ['add-pair', 'new-pair'] },
    removePair: { aliases: ['remove-pair', 'delete-pair', 'rm-pair', 'del-pair'] },
    unique: { aliases: ['unique-role', 'uniquify'] },
    roleCondition: { aliases: ['role-condition', 'condition', 'pre-condition'] },
  }),
})
export default class ReactionRoleCommand extends HorizonSubCommand {
  public async create(message: GuildMessage, args: Args): Promise<void> {
    const uniqueRole = args.getFlags(...uniqueFlags);
    let channel: GuildTextBasedChannel = (await args.pickResult('guildTextBasedChannel')).value;
    let title: string;
    let description: string;
    let roles: ReactionRolePair[];

    // 1. Ask all the necessary questions
    try {
      if (!channel)
        channel = await new ArgumentPrompter(message).promptTextChannel();

      [title, description] = await this._promptTitle(message);

      roles = await this._promptReactionRolesSafe(message);
    } catch (error: unknown) {
      if ((error as Error).message === 'STOP') {
        await message.channel.send(config.messages.stoppedPrompting);
        return;
      }
      throw error;
    }

    // 2. Send the confirmation embed
    const confirmationEmbed = new MessageEmbed()
      .setTitle(config.messages.confirmationTitle)
      .setDescription(
        pupa(config.messages.confirmationContent, {
          rolesList: roles.map(rr => pupa(config.messages.rolesListItem, rr)).join('\n'),
          channel,
          title,
          description: description || config.messages.noDescription,
        }),
      );
    const handler = new MessagePrompter({ embeds: [confirmationEmbed] }, 'confirm', {
      confirmEmoji: settings.emojis.yes,
      cancelEmoji: settings.emojis.no,
      timeout: 2 * 60 * 1000,
      explicitReturn: true,
    });
    const { confirmed, appliedMessage: prompterMessage } = await handler.run(message.channel, message.author)
      .catch(nullop) as IMessagePrompterExplicitConfirmReturn;

    await prompterMessage.reactions.removeAll();
    if (!confirmed) {
      await message.channel.send(config.messages.stoppedPrompting);
      await prompterMessage.edit({ embeds: [prompterMessage.embeds[0].setColor(settings.colors.red)] });
      return;
    }

    // 3. Send the menu, and add it to the database
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(description);
    const reactionRoleMessage = await channel.send({ embeds: [embed] });

    for (const rr of roles)
      await reactionRoleMessage.react(rr.reaction);

    this.container.client.reactionRolesIds.add(reactionRoleMessage.id);
    await ReactionRole.create({
      messageId: reactionRoleMessage.id,
      channelId: reactionRoleMessage.channel.id,
      guildId: reactionRoleMessage.guild.id,
      reactionRolePairs: roles.map(({ reaction, role }) => ({ reaction, role: role.id })),
      uniqueRole,
    });

    await prompterMessage.edit({ embeds: [prompterMessage.embeds[0].setColor(settings.colors.green)] });
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const reactionRoles = await ReactionRole.find({ guildId: message.guild.id });
    if (!reactionRoles || reactionRoles.length === 0) {
      await message.channel.send(config.messages.noMenus);
      return;
    }

    const items: Array<{
      condition: string;
      title: string;
      total: number;
      unique: boolean;
      url: string;
    }> = [];
    for (const rr of reactionRoles) {
      const rrChannel = message.guild.channels.resolve(rr.channelId) as GuildTextBasedChannel;
      const rrMessage = await rrChannel?.messages.fetch(rr.messageId).catch(nullop);
      if (!rrMessage)
        continue;

      items.push({
        condition: rr.roleCondition,
        title: rrMessage.embeds[0].title,
        total: rr.reactionRolePairs.length,
        unique: rr.uniqueRole,
        url: rrMessage.url,
      });
    }

    const baseEmbed = new MessageEmbed()
      .setTitle(pupa(config.messages.listTitle, { total: reactionRoles.length }))
      .setColor(settings.colors.default);

    await new PaginatedMessageEmbedFields()
      .setTemplate(baseEmbed)
      .setItems(
        items.map(rr => ({
          name: trimText(rr.title, EmbedLimits.MaximumFieldNameLength),
          value: pupa(config.messages.listFieldDescription, {
            ...rr,
            unique: rr.unique ? settings.emojis.yes : settings.emojis.no,
            condition: rr.condition ? roleMention(rr.condition) : settings.emojis.no,
          }),
        })),
      )
      .setItemsPerPage(5)
      .make()
      .run(message);
  }

  @ResolveReactionRoleArgument()
  public async remove(message: GuildMessage, _args: Args, { rrMessage }: ExtraContext): Promise<void> {
    // We delete it, and the "messageDelete" listener will take care of the rest.
    await rrMessage.delete();
    await message.channel.send(config.messages.removedMenu);
  }

  @ResolveReactionRoleArgument()
  public async edit(message: GuildMessage, _args: Args, { rrMessage }: ExtraContext): Promise<void> {
    const [title, description] = await this._promptTitle(message);

    const embed = rrMessage.embeds[0];
    embed.setTitle(title);
    embed.setDescription(description);
    await rrMessage.edit({ embeds: [embed] });

    await message.channel.send(config.messages.editedMenu);
  }

  @ResolveReactionRoleArgument({ getDocument: true })
  public async addPair(message: GuildMessage, args: Args, { document, rrMessage }: ExtraContext): Promise<void> {
    const emojiQuery = (await args.pickResult('string'))?.value;
    const reaction = CustomResolvers.resolveEmoji(emojiQuery, message.guild);
    if (reaction.error) {
      await message.channel.send(config.messages.invalidReaction);
      return;
    }
    if (document.reactionRolePairs.some(pair => pair.reaction === reaction.value)) {
      await message.channel.send(config.messages.reactionAlreadyUsed);
      return;
    }

    const role = (await args.pickResult('role'))?.value;
    if (!role) {
      await message.channel.send(config.messages.invalidRole);
      return;
    }
    if (document.reactionRolePairs.some(pair => pair.role === role.id)) {
      await message.channel.send(config.messages.roleAlreadyUsed);
      return;
    }

    await rrMessage.react(emojiQuery);

    document.reactionRolePairs.push({ reaction: reaction.value, role: role.id });
    await document.save();
    await message.channel.send(
      pupa(config.messages.addedPairSuccessfuly, { reaction: reaction.value, role, rrMessage }),
    );
  }

  @ResolveReactionRoleArgument({ getDocument: true })
  public async removePair(message: GuildMessage, args: Args, { document, rrMessage }: ExtraContext): Promise<void> {
    const role = (await args.pickResult('role'))?.value;
    if (!role) {
      await message.channel.send(config.messages.invalidRole);
      return;
    }
    const pair = document.reactionRolePairs.find(rrp => rrp.role === role.id);
    if (!pair) {
      await message.channel.send(config.messages.roleNotUsed);
      return;
    }

    await rrMessage.reactions.cache.get(pair.reaction).remove();

    document.reactionRolePairs.pull(pair);
    await document.save();
    await message.channel.send(pupa(config.messages.removedPairSuccessfuly, { rrMessage }));
  }

  @ResolveReactionRoleArgument({ getDocument: true })
  public async unique(message: GuildMessage, args: Args, { document }: ExtraContext): Promise<void> {
    const uniqueRole = await args.pickResult('boolean');

    const isUnique = (unique: boolean): string => config.messages[unique ? 'uniqueEnabled' : 'uniqueDisabled'];

    if (uniqueRole.error) {
      await message.channel.send(pupa(config.messages.uniqueMode, { uniqueMode: isUnique(document.uniqueRole) }));
      return;
    }

    document.uniqueRole = uniqueRole.value;
    await document.save();
    await message.channel.send(pupa(config.messages.changedUniqueMode, { uniqueMode: isUnique(document.uniqueRole) }));
  }

  @ResolveReactionRoleArgument({ getDocument: true })
  public async roleCondition(message: GuildMessage, args: Args, { document }: ExtraContext): Promise<void> {
    const askedRole = await args.pick('role').catch(async () => await args.pick('string').catch(nullop));

    const showText = (role: Role | string, contentNoRole: string, contentRole: string): MessageOptions => (
      role instanceof Role
        ? { embeds: [new MessageEmbed().setColor(settings.colors.default).setDescription(pupa(contentRole, { role }))] }
        : { content: contentNoRole }
    );

    const shouldRemoveCondition = askedRole === 'clear';
    if (shouldRemoveCondition || askedRole instanceof Role) {
      document.roleCondition = shouldRemoveCondition ? null : askedRole.id;
      await document.save();
      await message.channel.send(
        showText(askedRole, config.messages.removedRoleCondition, config.messages.changedRoleCondition),
      );
      return;
    }

    const condition = document.roleCondition ? message.guild.roles.cache.get(document.roleCondition) : null;
    await message.channel.send(showText(condition, config.messages.noRoleCondition, config.messages.roleCondition));
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields(config.messages.helpEmbedDescription)
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }

  private async _promptTitle(message: GuildMessage): Promise<[title: string, description: string]> {
    const handler = new MessagePrompter(
      config.messages.titlePrompt,
      'message',
      { timeout: 2 * 60 * 1000 },
    );
    const result = await handler.run(message.channel, message.author) as GuildMessage;
    if (settings.configuration.stop.has(result.content))
      throw new Error('STOP');

    return firstAndRest(result.content, '\n');
  }

  private async _promptReactionRolesSafe(message: GuildMessage): Promise<ReactionRolePair[]> {
    let roles: ReactionRoleReturnPayload;

    do {
      roles = await this._promptReactionRoles(message);

      if (roles.isError) {
        const listAnd = (items: string[]): string => new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' }).format(new Set(items));
        if (roles.errorPayload?.reactions?.length > 0) {
          await message.channel.send(
            pupa(config.messages.duplicatedEmojis, { duplicatedEmojis: listAnd(roles.errorPayload.reactions) }),
          );
        } else if (roles.errorPayload?.roles?.length > 0) {
          await message.channel.send(
            pupa(config.messages.duplicatedRoles, { duplicatedRoles: listAnd(roles.errorPayload.roles) }),
          );
        }
      } else if (roles.reactionRoles.length === 0) {
        await message.channel.send(config.messages.invalidEntries);
      }
    } while (roles.isError || roles.reactionRoles.length === 0);

    return roles.reactionRoles;
  }

  private async _promptReactionRoles(message: GuildMessage): Promise<ReactionRoleReturnPayload> {
    const handler = new MessagePrompter(
      config.messages.rolesPrompt,
      'message',
      { timeout: 2 * 60 * 1000 },
    );
    const result = await handler.run(message.channel, message.author) as GuildMessage;
    if (settings.configuration.stop.has(result.content))
      throw new Error('STOP');

    const lines = result.content.split('\n').filter(Boolean).slice(0, 20);
    const payload: ReactionRoleReturnPayload = { isError: false, errorPayload: {}, reactionRoles: [] };

    // Parse each line as "reaction role_resolvable"
    for (const line of lines) {
      const [emojiQuery, roleQuery] = firstAndRest(line, ' ');

      // Resolve the emoji, either from a standard emoji, or from a custom guild emoji.
      const emoji = CustomResolvers.resolveEmoji(emojiQuery, result.guild);
      if (emoji.error) {
        this.container.logger.warn(`[Reaction Roles] Emoji ${emojiQuery} not found (resolve to base emoji/guild emote's cache) (guild: ${message.guild.id}).`);
        continue;
      }

      const role = await Resolvers.resolveRole(roleQuery, result.guild);
      if (role.error) {
        this.container.logger.warn(`[Reaction Roles] Role ${roleQuery} not found in guild's cache (guild: ${message.guild.id}).`);
        continue;
      }

      payload.reactionRoles.push({ reaction: emoji.value, role: role.value });
    }

    // Remove all duplicates by field "role"
    const strippedRoles = payload.reactionRoles.uniqueBy(value => value.role);
    // If we actually removed elements, there was duplicates. We return an error
    if (strippedRoles.length !== payload.reactionRoles.length) {
      const multiples = difference(payload.reactionRoles, strippedRoles).map(rr => rr.role.name);
      payload.isError = true;
      payload.errorPayload.roles = multiples;
    }

    // Remove all duplicates by field "reaction"
    const strippedEmojis = payload.reactionRoles.uniqueBy(value => value.reaction);
    // If we actually removed elements, there was duplicates. We return an error
    if (strippedEmojis.length !== payload.reactionRoles.length) {
      const multiples = difference(payload.reactionRoles, strippedEmojis).map(rr => rr.reaction);
      payload.isError = true;
      payload.errorPayload.reactions = multiples;
    }

    return payload;
  }
}
