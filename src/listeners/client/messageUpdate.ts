import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { User } from 'discord.js';
import pupa from 'pupa';
import type { GuildMessage } from '@/app/lib/types';
import { noop } from '@/app/lib/utils';
import messages from '@/config/messages';
import settings from '@/config/settings';
import * as DiscordLogManager from '@/structures/DiscordLogManager';
import { DiscordLogType } from '@/types/database';

export default class MessageUpdateListener extends Listener {
  public async run(oldMessage: Message, newMessage: Message): Promise<void> {
    if (newMessage.author.bot || newMessage.system || !newMessage.inGuild() || !oldMessage.inGuild())
      return;

    await DiscordLogManager.logAction({
      type: DiscordLogType.MessageEdit,
      context: { messageId: newMessage.id, channelId: newMessage.channel.id, authorId: newMessage.author.id },
      content: { before: oldMessage.content, after: newMessage.content },
      guildId: newMessage.guild.id,
      severity: 1,
    });

    await this._checkAntiGhostPing(oldMessage, newMessage);
  }

  private async _checkAntiGhostPing(oldMessage: GuildMessage, newMessage: GuildMessage): Promise<void> {
    // List of all users that were mentionned in the old message.
    const oldUserMentions = [...oldMessage.mentions.users.values()]
      .filter(usr => !usr.bot && usr.id !== newMessage.author.id);
      // List of all roles that were mentionned in the old message.
    const oldRoleMentions = [...oldMessage.mentions.roles.values()]
      .filter(role => !role.managed);
    // List of usernames / roles name's that were mentionned in the old message.
    const oldMentions = [...oldUserMentions, ...oldRoleMentions];

    // List of all users that are mentionned in the new message.
    const newUserMentions = [...newMessage.mentions.users.values()]
      .filter(usr => !usr.bot && usr.id !== newMessage.author.id);
    // List of all roles that are mentionned in the new message.
    const newRoleMentions = [...newMessage.mentions.roles.values()]
      .filter(role => !role.managed);
    // List of usernames / roles name's that are mentionned in the new message.
    const newMentions = [...newUserMentions, ...newRoleMentions];

    // Filter out all the mentions that were in the previous message *and* in the new message.
    const deletedMentions = oldMentions.filter(
      oldMention => !newMentions.some(newMention => oldMention.id === newMention.id),
    );
    if (deletedMentions.length === 0)
      return;

    // Gt all the deleted role mentions
    const deletedRoleMentions = oldRoleMentions.filter(
      oldRoleMention => !newRoleMentions.some(newRoleMention => oldRoleMention.id === newRoleMention.id),
    );

    // Choose the message (plural if multiple people (or a role) were ghost-ping)
    const severalPeopleAffected = deletedMentions.length > 1 || deletedRoleMentions.length > 0;
    const baseMessage = severalPeopleAffected
      ? messages.ghostPing.alertPlural
      : messages.ghostPing.alertSingular;

    const botNotificationMessage = await newMessage.channel.send(
      pupa(baseMessage, {
        mentions: deletedMentions
          .map(mention => (mention instanceof User ? mention.username : mention.name))
          .join(', '),
        user: newMessage.author,
      }),
    ).catch(noop);
    if (!botNotificationMessage)
      return;

    // If a group of people were ghost-ping, we don't want one people to just remove the alert.
    if (severalPeopleAffected)
      return;

    await botNotificationMessage.react(settings.emojis.remove).catch(noop);
    const collector = botNotificationMessage
      .createReactionCollector({
        filter: (r, user) => (r.emoji.id ?? r.emoji.name) === settings.emojis.remove
          && (user.id === deletedMentions[0].id)
          && !user.bot,
      }).on('collect', async () => {
        collector.stop();
        await botNotificationMessage.delete().catch(noop);
      });
  }
}
