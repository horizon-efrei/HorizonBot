import { Event } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import messages from '@/config/messages';
import ReactionRole from '@/models/reactionRole';
import type { GuildMessage } from '@/types';
import { noop } from '@/utils';

export default class MessageReactionAddEvent extends Event {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;
    const member = message.guild.members.cache.get(user.id);

    // If we are reacting to a reaction role
    if (this.context.client.reactionRolesIds.includes(reaction.message.id))
      await this._handleReactionRole(reaction, member, message);

    // If we are reacting to a flag message alert
    if (this.context.client.flaggedMessages.some(msg => msg.alertMessage.id === reaction.message.id)
      && reaction.emoji.name === '✅')
      await this._handleModeratorFlag(reaction, member, message);
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

    if (!member) {
      this.context.logger.warn(`[Reaction Roles] An error has occured while trying to get member with id ${member.id}`);
      return;
    }

    if (!member.roles.cache.get(givenRole.id))
      member.roles.add(givenRole).catch(noop);
  }

  private async _handleModeratorFlag(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    // Wait for a moderator to approve the suppression of the message
    if (reaction.emoji.name !== '✅')
      return;

    const flagMessage = this.context.client.flaggedMessages.find(msg => msg.alertMessage.id === message.id);
    try {
      await flagMessage.approve(member);
    } catch (error: unknown) {
      this.context.logger.error('[Anti Swear] An error occured while trying to confirm a flagged message...');
      this.context.logger.error(error);
      flagMessage.alertMessage.channel.send(messages.global.oops).catch(noop);
    }
  }
}
