import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { Collection, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import PaginatedContentMessageEmbed from '@/app/lib/structures/PaginatedContentMessageEmbed';
import { logs as config } from '@/config/commands/admin';
import messages from '@/config/messages';
import LogStatuses from '@/models/logStatuses';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { DiscordLogType, LogStatuses as LogStatusesEnum } from '@/types/database';
import { inlineCodeList, nullop } from '@/utils';

const logNames = new Collection<DiscordLogType, string[]>([
  [DiscordLogType.ChangeNickname, ['change-nickname', 'changenickname', 'nickname-change', 'nicknamechange']],
  [DiscordLogType.ChangeUsername, ['change-username', 'changeusername', 'username-change', 'usernamechange']],
  [DiscordLogType.GuildJoin, ['guild-join', 'guildjoin', 'join-guild', 'joinguild']],
  [DiscordLogType.GuildLeave, ['guild-leave', 'guildleave', 'leave-guild', 'leaveguild']],
  [DiscordLogType.InvitePost, ['invite-post', 'invitepost', 'post-invite', 'postinvite']],
  [DiscordLogType.MessageEdit, ['message-edit', 'messageedit', 'edit-message', 'editmessage']],
  [DiscordLogType.MessagePost, ['message-post', 'messagepost', 'post-message', 'postmessage']],
  [DiscordLogType.MessageRemove, ['message-remove', 'messageremove', 'remove-message', 'removemessage']],
  [DiscordLogType.ReactionAdd, ['reaction-add', 'reactionadd', 'add-reaction', 'addreaction']],
  [DiscordLogType.ReactionRemove, ['reaction-remove', 'reactionremove', 'remove-reaction', 'removereaction']],
  [DiscordLogType.RoleAdd, ['role-add', 'roleadd', 'add-role', 'addrole']],
  [DiscordLogType.RoleRemove, ['role-remove', 'roleremove', 'remove-role', 'removerole']],
  [DiscordLogType.VoiceJoin, ['voice-join', 'voicejoin', 'join-voice', 'joinvoice']],
  [DiscordLogType.VoiceLeave, ['voice-leave', 'voiceleave', 'leave-voice', 'leavevoice']],
]);

const logStatuses = new Collection<LogStatusesEnum, string[]>([
  [LogStatusesEnum.Disabled, ['disabled', 'disable', 'off', 'stop', '0']],
  [LogStatusesEnum.Silent, ['silent', 'quiet', '1']],
  [LogStatusesEnum.Console, ['console', '2']],
  [LogStatusesEnum.Discord, ['discord', 'all', 'everywhere', '3']],
]);

const logsPossibilitiesExamples = [...logNames.values()].map(v => v[0]);
const statusesPossibilitiesExamples = [...logStatuses.values()].map(v => v[0]);

const getLogInfo = (
  { type, status }: { type: DiscordLogType; status: LogStatusesEnum },
): { type: string; status: string } => ({
  type: messages.logs.simplifiedReadableEvents[type],
  status: config.messages.statuses[status],
});

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['GuildOnly', 'StaffOnly'],
})
export default class LogsCommand extends HorizonCommand {
  public async messageRun(message: GuildMessage, args: Args): Promise<void> {
    const askedLog = await args.pickResult('string').catch(nullop);
    const logType = askedLog.value === 'all' ? 'all' : logNames.findKey(names => names.includes(askedLog.value));

    if (isNullish(logType)) {
      await this._displayList(message);
      return;
    }

    const askedStatus = await args.pickResult('string').catch(nullop);
    const logStatus = logStatuses.findKey(statuses => statuses.includes(askedStatus.value));
    const guildId = message.guild.id;

    if (Number.isInteger(logStatus)) {
      if (logType === 'all') {
        await LogStatuses.updateMany({ guildId }, { status: logStatus });
        for (const type of Object.values(DiscordLogType).filter(Number.isInteger))
          this.container.client.logStatuses.get(guildId).set(type as DiscordLogType, logStatus);
        await message.channel.send(
          pupa(config.messages.updatedAllLog, { status: config.messages.statuses[logStatus] }),
        );
      } else {
        await LogStatuses.updateOne({ type: logType, guildId }, { status: logStatus });
        this.container.client.logStatuses.get(guildId).set(logType, logStatus);
        await message.channel.send(
          pupa(config.messages.updatedLog, getLogInfo({ type: logType, status: logStatus })),
        );
      }
    } else if (logType === 'all') {
      await this._displayList(message);
    } else {
      const log = await LogStatuses.findOne({ type: logType, guildId });
      await message.channel.send(pupa(config.messages.currentLogStatus, getLogInfo(log)));
    }
  }

  private async _displayList(message: GuildMessage): Promise<void> {
    const logs = await LogStatuses.find({ guildId: message.guild.id });

    await new PaginatedContentMessageEmbed()
      .setTemplate(
        new MessageEmbed()
        .setTitle(config.messages.listTitle)
        .addField(config.messages.possibilitiesTitle, pupa(config.messages.possibilitiesContent, {
          logs: inlineCodeList(logsPossibilitiesExamples),
          statuses: inlineCodeList(statusesPossibilitiesExamples),
        })),
      )
      .setItems(logs.map(log => pupa(config.messages.lineValue, getLogInfo(log))))
      .setItemsPerPage(10)
      .make()
      .run(message);
  }
}
