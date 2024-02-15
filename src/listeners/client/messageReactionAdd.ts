import { Listener } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import { settings } from '@/config/settings';
import * as EclassManager from '@/eclasses/EclassManager';
import { Eclass } from '@/models/eclass';
import { ReactionRole } from '@/models/reactionRole';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';
import { noop } from '@/utils';

export class MessageReactionAddListener extends Listener {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (reaction.message.system
      || user.bot
      || reaction.message.partial
      || reaction.message.channel.partial
      || !reaction.message.inGuild())
      return;

    const { message } = reaction;

    await DiscordLogManager.logAction({
      type: DiscordLogType.ReactionAdd,
      context: {
        messageId: message.id,
        channelId: message.channel.id,
        authorId: message.author.id,
        executorId: user.id,
      },
      content: reaction.emoji.id ?? reaction.emoji.name ?? 'unknown',
      guildId: message.guild.id,
      severity: 1,
    });

    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      this.container.logger.warn('[Message Reaction Add] Abort event due to unresolved member.');
      return;
    }

    // If we are reacting to a reaction role
    if (this.container.caches.reactionRolesIds.has(reaction.message.id))
      await this._handleReactionRole(reaction, member, message);

    // If we are reacting to an eclass role
    if (this.container.caches.eclassRolesIds.has(reaction.message.id)
      && reaction.emoji.name === settings.emojis.yes)
      await this._handleEclassRole(reaction, member, message);
  }

  private async _handleReactionRole(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await ReactionRole.findOne({ messageId: message.id });
    if (!document) {
      this.container.caches.reactionRolesIds.delete(message.id);
      return;
    }
    if (!document.reactionRolePairs.some(pair => pair.reaction === reaction.emoji.toString()))
      return;

    const pairs = document.reactionRolePairs
      .find(elt => elt.reaction === reaction.emoji.toString());
    if (!pairs?.reaction) {
      reaction.remove().catch(noop);
      return;
    }

    const givenRole = message.guild.roles.cache.get(pairs.role);
    if (!givenRole) {
      this.container.logger.warn(`[Reaction Roles] The role with id ${pairs.role} does not exist.`);
      return;
    }

    // If we have the role we are asking for, stop here
    if (member.roles.cache.get(givenRole.id))
      return;
    // If we can have only 1 role at a time from the menu, and we have at least one of the menu's roles, stop here
    if (document.uniqueRole && member.roles.cache.hasAny(...document.reactionRolePairs.map(pair => pair.role))) {
      await reaction.users.remove(member);
      return;
    }
    // If there is a role condition which we do not pass, stop here
    if (document.roleCondition && !member.roles.cache.has(document.roleCondition)) {
      await reaction.users.remove(member);
      return;
    }

    member.roles.add(givenRole).catch(noop);
    this.container.logger.debug(`[Reaction Roles] Added role ${givenRole.id} (${givenRole.name}) to member ${member.id} (${member.user.tag}).`);
  }

  private async _handleEclassRole(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await Eclass.findOne({ announcementMessageId: message.id });
    if (!document) {
      this.container.caches.eclassRolesIds.delete(message.id);
      return;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (document.professorId === member.id)
      await reaction.users.remove(member);
    else
      await EclassManager.subscribeMember(member, document);
  }
}
