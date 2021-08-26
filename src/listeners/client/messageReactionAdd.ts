import { Listener } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import ReactionRole from '@/models/reactionRole';
import Subject from '@/models/subject';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';
import { noop } from '@/utils';

export default class MessageReactionAddListener extends Listener {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;
    const member = message.guild.members.cache.get(user.id);
    if (!member) {
      this.container.logger.warn('[Message Reaction Add] Abort event due to unresolved member.');
      return;
    }

    // If a moderator is flagging a message
    if ((reaction.emoji.id ?? reaction.emoji.name) === settings.configuration.flagMessageReaction
      && member.roles.cache.has(settings.roles.staff))
      await this._flagMessage(reaction, member, message);

    // If we are reacting to a reaction role
    if (this.container.client.reactionRolesIds.has(reaction.message.id))
      await this._handleReactionRole(reaction, member, message);

    // If we are reacting to an eclass role
    if (this.container.client.eclassRolesIds.has(reaction.message.id)
      && reaction.emoji.name === settings.emojis.yes)
      await this._handleEclassRole(reaction, member, message);

    // If we are reacting to a flag message alert
    if (this.container.client.waitingFlaggedMessages.some(msg => msg.alertMessage.id === reaction.message.id)
      && reaction.emoji.name === settings.emojis.yes)
      await this._handleModeratorFlag(reaction, member, message);

    // If we want to flag a question to call a professor
    if ((reaction.emoji.id ?? reaction.emoji.name) === settings.configuration.flagNeededAnswer)
      await this._handleEprofFlag(reaction, member, message);
  }

  private async _flagMessage(
    _reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    await new FlaggedMessage(message, { manualModerator: member }).start(true);
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

    if (!member.roles.cache.get(givenRole.id))
      member.roles.add(givenRole).catch(noop);
    this.container.logger.debug(`[Reaction Roles] Added role ${givenRole.id} (${givenRole.name}) to member ${member.id} (${member.displayName}#${member.user.discriminator}).`);
  }

  private async _handleEclassRole(
    _reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const document = await Eclass.findOne({ announcementMessage: message.id });
    if (!document) {
      this.container.client.eclassRolesIds.delete(message.id);
      return;
    }

    await EclassManager.subscribeMember(member, document);
  }

  private async _handleModeratorFlag(
    reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    // Wait for a moderator to approve the suppression of the message
    if (reaction.emoji.name !== settings.emojis.yes)
      return;

    const flagMessage = this.container.client.waitingFlaggedMessages.find(msg => msg.alertMessage.id === message.id);
    try {
      await flagMessage.approve(member);
    } catch (error: unknown) {
      this.container.logger.error('[Anti Swear] An error occured while trying to confirm a flagged message.');
      this.container.logger.error(error);
      flagMessage.alertMessage.channel.send(messages.global.oops).catch(noop);
    }
  }

  private async _handleEprofFlag(
    _reaction: MessageReaction,
    member: GuildMember,
    message: GuildMessage,
  ): Promise<void> {
    const subject = await Subject.findOne({
      $or: [
        { textChannel: message.channel.id },
        { textDocsChannel: message.channel.id },
      ],
    });
    const eProfRoleId = settings.roles.eprofs[subject.teachingUnit];
    if (!eProfRoleId)
      return;
    const eProf = message.guild.roles.cache
      .get(eProfRoleId)
      .members
      .filter(mbr => mbr.presence.status === 'online')
      .random();

    await message.channel.send(pupa(messages.miscellaneous.eprofMentionPublic, { eProf }));
    await eProf.send(pupa(messages.miscellaneous.eprofMentionPrivate, { member, message })).catch(noop);
  }
}
