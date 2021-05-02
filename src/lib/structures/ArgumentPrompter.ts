import type { IMessagePrompterExplicitMessageReturn } from '@sapphire/discord.js-utilities';
import { MessagePrompter, MessagePrompterStrategies } from '@sapphire/discord.js-utilities';
import type { GuildMember, Role } from 'discord.js';
import messages from '@/config/messages';
import settings from '@/config/settings';
import ArgumentResolver from '@/structures/ArgumentResolver';
import type { GuildMessage, GuildTextBasedChannel, HourMinutes } from '@/types';

// Overwrite 'appliedMessage' and 'response' in 'IMessagePrompterExplicitMessageReturn' for them
// to be GuildMessages rather than Messages
type PrompterMessageResult = Omit<IMessagePrompterExplicitMessageReturn, 'appliedMessage' | 'response'> & { response: GuildMessage; appliedMessage: GuildMessage };

async function prompt(
  message: GuildMessage,
  messageArray: GuildMessage[],
  text: string,
): Promise<GuildMessage> {
  const handler = new MessagePrompter(
    text,
    MessagePrompterStrategies.Message,
    { timeout: 60 * 1000, explicitReturn: true },
  );
  const { response, appliedMessage } = await handler.run(message.channel, message.author) as PrompterMessageResult;
  if (messageArray)
    messageArray.push(response, appliedMessage);

  if (settings.configuration.stop.has(response.content))
    throw new Error('STOP');
  return response;
}

export default {
  async promptTextChannel(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<GuildTextBasedChannel> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidChannel : messages.prompts.promptChannel,
    );

    if (message.mentions.channels.size > 0 && message.mentions.channels.first().isText())
      return message.mentions.channels.first();

    const query = response.content.split(' ').join('-');
    return ArgumentResolver.resolveChannelByID(query, response.guild)
      ?? ArgumentResolver.resolveChannelByQuery(query, response.guild);
  },

  async promptMessage(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<GuildMessage> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidMessage : messages.prompts.promptMessage,
    );

    return await ArgumentResolver.resolveMessageByID(response.content, response.channel)
      ?? await ArgumentResolver.resolveMessageByLink(response.content, response.guild, response.author);
  },

  async promptText(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<string> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidText : messages.prompts.promptText,
    );

    return response.content;
  },

  async promptDate(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<Date> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidDate : messages.prompts.promptDate,
    );

    return ArgumentResolver.resolveDate(response.content);
  },

  async promptHour(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<HourMinutes> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidHour : messages.prompts.promptHour,
    );

    return ArgumentResolver.resolveHour(response.content);
  },

  async promptDuration(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<number> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidDuration : messages.prompts.promptDuration,
    );

    return ArgumentResolver.resolveDuration(response.content);
  },

  async promptMember(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<GuildMember> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidMember : messages.prompts.promptMember,
    );

    if (message.mentions.members.size > 0)
      return message.mentions.members.first();

    return ArgumentResolver.resolveMemberByQuery(response.content, message.guild)
      ?? await ArgumentResolver.resolveMemberByID(response.content, message.guild);
  },

  async promptRole(
    message: GuildMessage,
    messageArray?: GuildMessage[],
    previousIsFailure = false,
  ): Promise<Role> {
    const response = await prompt(
      message,
      messageArray,
      previousIsFailure ? messages.prompts.promptInvalidRole : messages.prompts.promptRole,
    );

    if (message.mentions.roles.size > 0)
      return message.mentions.roles.first();

    return ArgumentResolver.resolveRoleByID(response.content, message.guild)
      ?? ArgumentResolver.resolveRoleByQuery(response.content, message.guild);
  },
};
