import { isGuildBasedChannel, MessagePrompter } from '@sapphire/discord.js-utilities';
import { Resolvers } from '@sapphire/framework';
import type { GuildMember, Message, Role } from 'discord.js';
import messages from '@/config/messages';
import settings from '@/config/settings';
import * as CustomResolvers from '@/resolvers';
import type {
  GuildMessage,
  GuildTextBasedChannel,
  HourMinutes,
  PrompterMessageResult,
  PrompterText,
} from '@/types';

export default class ArgumentPrompter {
  private _terminated = false;

  constructor(
    private readonly _message: Message,
    private readonly _options?: {
      messageArray?: Set<Message>;
      baseMessage?: Message;
    },
  ) {}

  public async autoPromptTextChannel(
    prompts?: PrompterText,
    previousIsFailure = false,
  ): Promise<GuildTextBasedChannel> {
    let response = await this.promptTextChannel(prompts, previousIsFailure);
    while (!response)
      response = await this.promptTextChannel(prompts, true);
    return response;
  }

  public async autoPromptMessage(prompts?: PrompterText, previousIsFailure = false): Promise<Message> {
    let response = await this.promptMessage(prompts, previousIsFailure);
    while (!response)
      response = await this.promptMessage(prompts, true);
    return response;
  }

  public async autoPromptText(prompts?: PrompterText, previousIsFailure = false): Promise<string> {
    let response = await this.promptText(prompts, previousIsFailure);
    while (!response)
      response = await this.promptText(prompts, true);
    return response;
  }

  public async autoPromptUrl(prompts?: PrompterText, previousIsFailure = false): Promise<URL> {
    let response = await this.promptUrl(prompts, previousIsFailure);
    while (!response)
      response = await this.promptUrl(prompts, true);
    return response;
  }

  public async autoPromptDay(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    let response = await this.promptDay(prompts, previousIsFailure);
    while (!response)
      response = await this.promptDay(prompts, true);
    return response;
  }

  public async autoPromptHour(prompts?: PrompterText, previousIsFailure = false): Promise<HourMinutes> {
    let response = await this.promptHour(prompts, previousIsFailure);
    while (!response)
      response = await this.promptHour(prompts, true);
    return response;
  }

  public async autoPromptDate(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    let response = await this.promptDate(prompts, previousIsFailure);
    while (!response)
      response = await this.promptDate(prompts, true);
    return response;
  }

  public async autoPromptDuration(prompts?: PrompterText, previousIsFailure = false): Promise<number> {
    let response = await this.promptDuration(prompts, previousIsFailure);
    while (!response)
      response = await this.promptDuration(prompts, true);
    return response;
  }

  public async autoPromptMember(prompts?: PrompterText, previousIsFailure = false): Promise<GuildMember> {
    let response = await this.promptMember(prompts, previousIsFailure);
    while (!response)
      response = await this.promptMember(prompts, true);
    return response;
  }

  public async autoPromptRole(prompts?: PrompterText, previousIsFailure = false): Promise<Role> {
    let response = await this.promptRole(prompts, previousIsFailure);
    while (!response)
      response = await this.promptRole(prompts, true);
    return response;
  }

  public async autoPromptBoolean(prompts?: PrompterText, previousIsFailure = false): Promise<boolean> {
    let response = await this.promptBoolean(prompts, previousIsFailure);
    while (!response)
      response = await this.promptBoolean(prompts, true);
    return response;
  }

  public async promptTextChannel(prompts?: PrompterText, previousIsFailure = false): Promise<GuildTextBasedChannel> {
    const response = await this._prompt({ ...messages.prompts.channel, ...prompts }, previousIsFailure);

    const firstMention = response.mentions.channels.first();
    if (response.mentions.channels.size > 0 && firstMention.isText() && isGuildBasedChannel(firstMention))
      return firstMention;

    const query = response.content.split(' ').join('-');
    return CustomResolvers.resolveGuildTextBasedChannel(query, response).value;
  }

  public async promptMessage(prompts?: PrompterText, previousIsFailure = false): Promise<Message> {
    const response = await this._prompt({ ...messages.prompts.message, ...prompts }, previousIsFailure);
    const message = await Resolvers.resolveMessage(response.content, { message: response });
    return message.value;
  }

  public async promptText(prompts?: PrompterText, previousIsFailure = false): Promise<string> {
    const response = await this._prompt({ ...messages.prompts.text, ...prompts }, previousIsFailure);
    return Resolvers.resolveString(response.content).value;
  }

  public async promptUrl(prompts?: PrompterText, previousIsFailure = false): Promise<URL> {
    const response = await this._prompt({ ...messages.prompts.url, ...prompts }, previousIsFailure);
    return Resolvers.resolveHyperlink(response.content).value;
  }

  public async promptDay(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    const response = await this._prompt({ ...messages.prompts.day, ...prompts }, previousIsFailure);
    return CustomResolvers.resolveDay(response.content).value;
  }

  public async promptHour(prompts?: PrompterText, previousIsFailure = false): Promise<HourMinutes> {
    const response = await this._prompt({ ...messages.prompts.hour, ...prompts }, previousIsFailure);
    return CustomResolvers.resolveHour(response.content).value;
  }

  public async promptDate(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    const response = await this._prompt({ ...messages.prompts.date, ...prompts }, previousIsFailure);
    return CustomResolvers.resolveDate(response.content).value;
  }

  public async promptDuration(prompts?: PrompterText, previousIsFailure = false): Promise<number> {
    const response = await this._prompt({ ...messages.prompts.duration, ...prompts }, previousIsFailure);
    return CustomResolvers.resolveDuration(response.content).value;
  }

  public async promptMember(prompts?: PrompterText, previousIsFailure = false): Promise<GuildMember> {
    const response = await this._prompt({ ...messages.prompts.channel, ...prompts }, previousIsFailure);
    if (response.mentions.members.size > 0)
      return response.mentions.members.first();

    const member = await Resolvers.resolveMember(response.content, response.guild);
    return member.value;
  }

  public async promptRole(prompts?: PrompterText, previousIsFailure = false): Promise<Role> {
    const response = await this._prompt({ ...messages.prompts.role, ...prompts }, previousIsFailure);
    if (response.mentions.roles.size > 0)
      return response.mentions.roles.first();

    const role = await Resolvers.resolveRole(response.content, response.guild);
    return role.value;
  }

  public async promptBoolean(prompts?: PrompterText, previousIsFailure = false): Promise<boolean> {
    const response = await this._prompt({ ...messages.prompts.boolean, ...prompts }, previousIsFailure);
    return Resolvers.resolveBoolean(response.content, {
      truths: settings.configuration.booleanTruths,
      falses: settings.configuration.booleanFalses,
    }).value;
  }

  public terminate(): void {
    this._terminated = true;
  }

  private async _prompt(prompts: PrompterText, previousIsFailure: boolean): Promise<GuildMessage> {
    const handler = new MessagePrompter(
      previousIsFailure ? `${prompts.invalid} ${prompts.base}` : prompts.base,
      'message',
      { timeout: 2 * 60 * 1000, explicitReturn: true, editMessage: this._options?.baseMessage },
    );
    // FIXME: Yeahh.... We might want to refactor this. Every minute that goes by with this code
    // in production kills a koala.
    let response: GuildMessage;
    let appliedMessage: GuildMessage;
    try {
      const result = await handler.run(this._message.channel, this._message.author) as PrompterMessageResult;
      if (this._terminated)
        return;

      response = result.response;
      appliedMessage = result.appliedMessage;
    } catch (err: unknown) {
      if (err instanceof Map && err.size === 0)
        throw new Error('TIME OUT');
      throw err;
    }
    if (this._options?.messageArray)
      this._options.messageArray.addAll(response, appliedMessage);

    if (settings.configuration.stop.has(response.content))
      throw new Error('STOP');
    return response;
  }
}
