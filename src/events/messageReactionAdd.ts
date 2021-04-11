import { Event } from '@sapphire/framework';
import type { MessageReaction, User } from 'discord.js';
import ReactionRole from '@/models/reactionRole';
import type { GuildMessage } from '@/types';
import { noop } from '../lib/utils';

export default class MessageReactionAddEvent extends Event {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;

    // If we are reacting to a reaction role
    if (this.context.client.reactionRolesIds.includes(reaction.message.id)) {
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

      const member = message.guild.members.cache.get(user.id);
      if (!member) {
        this.context.logger.warn(`[Reaction Roles] An error has occured while trying to get member with id ${user.id}`);
        return;
      }

      if (!member.roles.cache.get(givenRole.id))
        member.roles.add(givenRole).catch(noop);
    }
  }
}
