import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import type { Args, CommandOptions } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { Collection, MessageEmbed } from 'discord.js';
import pupa from 'pupa';
import { logs as config } from '@/config/commands/admin';
import messages from '@/config/messages';
import settings from '@/config/settings';
import LogStatuses from '@/models/logStatuses';
import HorizonCommand from '@/structures/commands/HorizonCommand';
import type { GuildMessage } from '@/types';
import { DiscordLogType, LogStatuses as LogStatusesEnum } from '@/types/database';
import { nullop } from '@/utils';

const logNames = new Collection<DiscordLogType, string[]>([
  [DiscordLogType.ChangeNickname, ['changenickname', 'change-nickname', 'nickname-change']],
  [DiscordLogType.ChangeUsername, ['changeusername', 'change-username', 'username-change']],
  [DiscordLogType.GuildJoin, ['guildjoin', 'guild-join', 'join-guild']],
  [DiscordLogType.GuildLeave, ['guildleave', 'guild-leave', 'leave-guild']],
  [DiscordLogType.InvitePost, ['invitepost', 'invite-post', 'post-invite']],
  [DiscordLogType.MessageEdit, ['messageedit', 'message-edit', 'edit-message']],
  [DiscordLogType.MessagePost, ['messagepost', 'message-post', 'post-message']],
  [DiscordLogType.MessageRemove, ['messageremove', 'message-remove', 'remove-message']],
  [DiscordLogType.ReactionAdd, ['reactionadd', 'reaction-add', 'add-reaction']],
  [DiscordLogType.ReactionRemove, ['reactionremove', 'reaction-remove', 'remove-reaction']],
  [DiscordLogType.RoleAdd, ['roleadd', 'role-add', 'add-role']],
  [DiscordLogType.RoleRemove, ['roleremove', 'role-remove', 'remove-role']],
  [DiscordLogType.VoiceJoin, ['voicejoin', 'voice-join', 'join-voice']],
  [DiscordLogType.VoiceLeave, ['voiceleave', 'voice-leave', 'leave-voice']],
]);

const logStatuses = new Collection<LogStatusesEnum, string[]>([
  [LogStatusesEnum.Disabled, ['disabled', 'disable', 'off', 'stop', '0']],
  [LogStatusesEnum.Silent, ['silent', 'quiet', '1']],
  [LogStatusesEnum.Console, ['console', '2']],
  [LogStatusesEnum.Discord, ['discord', 'all', 'everywhere', '3']],
]);

const getLogInfo = (
  { type, status }: { type: DiscordLogType; status: LogStatusesEnum },
): { type: string; status: string } => ({
  type: messages.logs.simplifiedReadableEvents.get(type),
  status: config.messages.statuses[status],
});

@ApplyOptions<CommandOptions>({
  ...config.options,
  preconditions: ['StaffOnly'],
})
export default class LogsCommand extends HorizonCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
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

    await new PaginatedFieldMessageEmbed<{ type: DiscordLogType; status: LogStatusesEnum }>()
      .setTitleField(config.messages.listTitle)
      .setTemplate(new MessageEmbed().setColor(settings.colors.default))
      .setItems(logs)
      .formatItems(item => pupa(config.messages.lineValue, getLogInfo(item)))
      .setItemsPerPage(10)
      .make()
      .run(message);
  }
}
