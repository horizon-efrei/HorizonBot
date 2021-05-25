import { Event } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import ReactionRole from '@/models/reactionRole';
import EclassManager from '@/structures/EclassManager';
import type { GuildMessage } from '@/types';
import { noop } from '@/utils';

export default class MessageReactionRemoveEvent extends Event {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;
    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      this.context.logger.warn('[Message Reaction Remove] Abort even due to unresolved member.');
      return;
    }

    // If we are reacting to a reaction role
    if (this.context.client.reactionRolesIds.includes(reaction.message.id))
      await this._handleReactionRole(reaction, member, message);

    // If we are reacting to an eclass role
    if (this.context.client.eclassRolesIds.includes(reaction.message.id) && reaction.emoji.name === settings.emojis.yes)
      await this._handleEclassRole(reaction, member, message);
  }

  private async _handleReactionRole(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await ReactionRole.findOne({ messageId: message.id });
    if (!document) {
      this.context.client.reactionRolesIds = this.context.client.reactionRolesIds.filter(elt => elt !== message.id);
      return;
    }

    const { reaction: emoji, role: givenRoleId } = document.reactionRolePairs
      .find(elt => elt.reaction === reaction.emoji.toString());
    if (!emoji) {
      reaction.remove().catch(noop);
      return;
    }

    const givenRole = message.guild.roles.cache.get(givenRoleId);
    if (!givenRole) {
      this.context.logger.warn(`[Reaction Roles] The role with id ${givenRoleId} does not exists !`);
      return;
    }

    if (member.roles.cache.get(givenRole.id))
      member.roles.remove(givenRole).catch(noop);
  }

  private async _handleEclassRole(
    _reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await Eclass.findOne({ announcementMessage: message.id });
    if (!document) {
      this.context.client.reactionRolesIds = this.context.client.reactionRolesIds.filter(elt => elt !== message.id);
      return;
    }

    await EclassManager.unsubscribeMember(member, document);
  }
}
