import { Listener } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import settings from '@/config/settings';
import EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import ReactionRole from '@/models/reactionRole';
import DiscordLogManager from '@/structures/DiscordLogManager';
import type { GuildMessage } from '@/types';
import { DiscordLogType } from '@/types/database';
import { noop } from '@/utils';

export default class MessageReactionRemoveListener extends Listener {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (reaction.message.system || user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;

    await DiscordLogManager.logAction({
      type: DiscordLogType.ReactionRemove,
      context: {
        messageId: message.id,
        channelId: message.channel.id,
        authorId: message.author.id,
        executorId: user.id,
      },
      content: reaction.emoji.id ?? reaction.emoji.name,
      guildId: message.guild.id,
      severity: 1,
    });

    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      this.container.logger.warn('[Message Reaction Remove] Abort event due to unresolved member.');
      return;
    }

    // If we are reacting to a reaction role
    if (this.container.client.reactionRolesIds.has(reaction.message.id))
      await this._handleReactionRole(reaction, member, message);

    // If we are reacting to an eclass role
    if (this.container.client.eclassRolesIds.has(reaction.message.id) && reaction.emoji.name === settings.emojis.yes)
      await this._handleEclassRole(reaction, member, message);
  }

  private async _handleReactionRole(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await ReactionRole.findOne({ messageId: message.id });
    if (!document) {
      this.container.client.reactionRolesIds.delete(message.id);
      return;
    }

    if (!document.reactionRolePairs.some(pair => pair.reaction === reaction.emoji.toString()))
      return;

    const { reaction: emoji, role: givenRoleId } = document.reactionRolePairs
      .find(elt => elt.reaction === reaction.emoji.toString());
    if (!emoji) {
      reaction.remove().catch(noop);
      return;
    }

    const givenRole = message.guild.roles.cache.get(givenRoleId);
    if (!givenRole) {
      this.container.logger.warn(`[Reaction Roles] The role with id ${givenRoleId} does not exist.`);
      return;
    }

    if (member.roles.cache.get(givenRole.id))
      member.roles.remove(givenRole).catch(noop);
    this.container.logger.debug(`[Reaction Roles] Removed role ${givenRole.id} (${givenRole.name}) from member ${member.id} (${member.user.tag}).`);
  }

  private async _handleEclassRole(
    _reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await Eclass.findOne({ announcementMessage: message.id });
    if (!document) {
      this.container.client.reactionRolesIds.delete(message.id);
      return;
    }

    await EclassManager.unsubscribeMember(member, document);
  }
}
