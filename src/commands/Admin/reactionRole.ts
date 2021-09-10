import { ApplyOptions } from '@sapphire/decorators';
import { MessagePrompter } from '@sapphire/discord.js-utilities';
import type { Args } from '@sapphire/framework';
import { Resolvers } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { MessageEmbed } from 'discord.js';
import difference from 'lodash.difference';
import pupa from 'pupa';
import { reactionRole as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import ReactionRole from '@/models/reactionRole';
import * as CustomResolvers from '@/resolvers';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import type {
  GuildMessage,
  GuildTextBasedChannel,
  ReactionRolePair,
  ReactionRoleReturnPayload,
} from '@/types';
import {
  commaListAnd,
  firstAndRest,
  generateSubcommands,
  nullop,
} from '@/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  preconditions: ['StaffOnly'],
  subCommands: generateSubcommands({
    start: { aliases: ['make', 'setup', 'create', 'add'] },
    list: { aliases: ['liste', 'show'] },
    edit: { aliases: ['change', 'modify'] },
    addPair: { aliases: [] },
    removePair: { aliases: ['deletePair', 'suppr', 'rmPair', 'remPair', 'delPair'] },
    remove: { aliases: ['delete', 'rm', 'rem', 'del'] },
    help: { aliases: ['aide'], default: true },
  }),
})
export default class ReactionRoleCommand extends HorizonSubCommand {
  public async start(message: GuildMessage, args: Args): Promise<void> {
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
      timeout: 60 * 1000,
    });
    const isConfirmed = await handler.run(message.channel, message.author).catch(nullop);

    if (!isConfirmed) {
      await message.channel.send(config.messages.stoppedPrompting);
      return;
    }

    // 3. Send the menu, and add it to the database
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(description);
    const reactionRoleMessage = await channel.send({ embeds: [embed] });

    for (const rr of roles)
      await reactionRoleMessage.react(rr.reaction);

    const document = {
      messageId: reactionRoleMessage.id,
      channelId: reactionRoleMessage.channel.id,
      guildId: reactionRoleMessage.guild.id,
      reactionRolePairs: roles.map(({ reaction, role }) => ({ reaction, role: role.id })),
    };

    this.container.client.reactionRolesIds.add(document.messageId);
    await ReactionRole.create(document);
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const reactionRoles = await ReactionRole.find({ guildId: message.guild.id });
    if (!reactionRoles || reactionRoles.length === 0) {
      await message.channel.send(config.messages.noMenus);
      return;
    }

    let description = '';
    for (const rr of reactionRoles) {
      const rrChannel = message.guild.channels.resolve(rr.channelId) as GuildTextBasedChannel;
      const rrMessage = await rrChannel?.messages.fetch(rr.messageId).catch(nullop);
      if (!rrMessage)
        continue;

      description += pupa(config.messages.listEmbedDescription, {
        title: rrMessage.embeds[0].title,
        url: rrMessage.url,
        total: rr.reactionRolePairs.length,
      });
    }

    const embed = new MessageEmbed()
      .setTitle(pupa(config.messages.listEmbedTitle, { message, total: reactionRoles.length }))
      .setDescription(description);
    await message.channel.send({ embeds: [embed] });
  }

  public async remove(message: GuildMessage, args: Args): Promise<void> {
    let givenMessage = (await args.pickResult('message')).value;
    if (!givenMessage)
      givenMessage = await new ArgumentPrompter(message).autoPromptMessage();

    const isRrMenu = this.container.client.reactionRolesIds.has(givenMessage.id);
    if (!isRrMenu) {
      await message.channel.send(config.messages.notAMenu);
      return;
    }

    // We delete it, and the "messageDelete" listener will take care of the rest.
    await givenMessage.delete();
    await message.channel.send(config.messages.removedMenu);
  }

  public async edit(message: GuildMessage, args: Args): Promise<void> {
    let givenMessage = (await args.pickResult('message')).value;
    if (!givenMessage)
      givenMessage = await new ArgumentPrompter(message).autoPromptMessage();

    const [title, description] = await this._promptTitle(message);

    const embed = givenMessage.embeds[0];
    embed.setTitle(title);
    embed.setDescription(description);
    await givenMessage.edit({ embeds: [embed] });

    await message.channel.send(config.messages.editedMenu);
  }

  public async addPair(message: GuildMessage, args: Args): Promise<void> {
    const rrMessage = (await args.pickResult('message'))?.value as GuildMessage;
    if (!rrMessage) {
      await message.channel.send(config.messages.notAMessage);
      return;
    }

    const document = await ReactionRole.findOne({ messageId: rrMessage.id });
    if (!rrMessage) {
      await message.channel.send(config.messages.notAMenu);
      return;
    }

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

  public async removePair(message: GuildMessage, args: Args): Promise<void> {
    const rrMessage = (await args.pickResult('message'))?.value as GuildMessage;
    if (!rrMessage) {
      await message.channel.send(config.messages.notAMessage);
      return;
    }

    const document = await ReactionRole.findOne({ messageId: rrMessage.id });
    if (!rrMessage) {
      await message.channel.send(config.messages.notAMenu);
      return;
    }

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
      { timeout: 60 * 1000 },
    );
    const result = await handler.run(message.channel, message.author) as GuildMessage;
    if (settings.configuration.stop.has(result.content))
      throw new Error('STOP');

    return firstAndRest(result.content, '\n');
  }

  private async _promptReactionRolesSafe(message: GuildMessage): Promise<ReactionRolePair[]> {
    let roles = await this._promptReactionRoles(message);

    while (roles.isError || roles.reactionRoles.length === 0) {
      roles = await this._promptReactionRoles(message);

      if (roles.isError) {
        if (roles.errorPayload.reactions.length > 0) {
          await message.channel.send(
            pupa(config.messages.duplicatedEmojis, {
              duplicatedEmojits: commaListAnd`${[...new Set(roles.errorPayload.reactions)]}`,
            }),
          );
        } else if (roles.errorPayload.roles.length > 0) {
          await message.channel.send(
            pupa(config.messages.duplicatedRoles, {
              duplicatedRoles: commaListAnd`${[...new Set(roles.errorPayload.roles)]}`,
            }),
          );
        }
      } else if (roles.reactionRoles.length === 0) {
        await message.channel.send(config.messages.invalidEntries);
      }
    }

    return roles.reactionRoles;
  }

  private async _promptReactionRoles(message: GuildMessage): Promise<ReactionRoleReturnPayload> {
    const handler = new MessagePrompter(
      config.messages.rolesPrompt,
      'message',
      { timeout: 60 * 1000 },
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
