import { Listener } from '@sapphire/framework';
import type { GuildMember, MessageReaction, User } from 'discord.js';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import * as EclassManager from '@/eclasses/EclassManager';
import Eclass from '@/models/eclass';
import ReactionRole from '@/models/reactionRole';
import Subject from '@/models/subject';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import FlaggedMessage from '@/structures/FlaggedMessage';
import type { GuildMessage } from '@/types';
import { TeachingUnit } from '@/types';
import { ConfigEntriesRoles, DiscordLogType } from '@/types/database';
import { noop } from '@/utils';

const teachingUnitEprofMapping = new Map([
  [TeachingUnit.ComputerScience, ConfigEntriesRoles.EprofComputerScience],
  [TeachingUnit.GeneralFormation, ConfigEntriesRoles.EprofGeneralFormation],
  [TeachingUnit.Mathematics, ConfigEntriesRoles.EprofMathematics],
  [TeachingUnit.PhysicsElectronics, ConfigEntriesRoles.EprofPhysicsElectronics],
]);

export default class MessageReactionAddListener extends Listener {
  public async run(reaction: MessageReaction, user: User): Promise<void> {
    if (reaction.message.system || user.bot || !('guild' in reaction.message.channel))
      return;

    const message = reaction.message as GuildMessage;

    await DiscordLogManager.logAction({
      type: DiscordLogType.ReactionAdd,
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
      this.container.logger.warn('[Message Reaction Add] Abort event due to unresolved member.');
      return;
    }

    // If a moderator is flagging a message
    const staffRole = await this.container.client.configManager.get(ConfigEntriesRoles.Staff, message.guild.id);
    if ((reaction.emoji.id ?? reaction.emoji.name) === settings.configuration.flagMessageReaction
      && member.roles.cache.has(staffRole.id))
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

    // If we have the role we are asking for, stop here
    if (member.roles.cache.get(givenRole.id))
      return;
    // If we can have only 1 role at a time from the menu and we have at least one of the menu's roles, stop here
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
    const document = await Eclass.findOne({ announcementMessage: message.id });
    if (!document) {
      this.container.client.eclassRolesIds.delete(message.id);
      return;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (document.professor === member.id)
      await reaction.users.remove(member);
    else
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
    const eprofRoleIdEntry = teachingUnitEprofMapping.get(subject.teachingUnit);
    const eprofRole = await this.container.client.configManager.get(eprofRoleIdEntry, message.guild.id);
    if (!eprofRole)
      return;

    const eProf = message.guild.roles.cache
      .get(eprofRole.id)
      .members
      .filter(mbr => mbr.presence.status === 'online')
      .random();

    await message.channel.send(pupa(messages.miscellaneous.eprofMentionPublic, { eProf }));
    await eProf.send(pupa(messages.miscellaneous.eprofMentionPrivate, { member, message })).catch(noop);
  }
}
