import { isGuildBasedChannel, MessagePrompter } from '@sapphire/discord.js-utilities';
import { Resolvers } from '@sapphire/framework';
import type { GuildMember, Role } from 'discord.js';
import messages from '@/config/messages';
import settings from '@/config/settings';
import CustomResolvers from '@/resolvers';
import type {
  GuildMessage,
  GuildTextBasedChannel,
  HourMinutes,
  PrompterMessageResult,
  PrompterText,
} from '@/types';

export default class ArgumentPrompter {
  constructor(
    private readonly _message: GuildMessage,
    private readonly _options?: {
      messageArray?: Set<GuildMessage>;
      baseMessage?: GuildMessage;
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

  public async autoPromptMessage(prompts?: PrompterText, previousIsFailure = false): Promise<GuildMessage> {
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

  public async autoPromptDate(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    let response = await this.promptDate(prompts, previousIsFailure);
    while (!response)
      response = await this.promptDate(prompts, true);
    return response;
  }

  public async autoPromptHour(prompts?: PrompterText, previousIsFailure = false): Promise<HourMinutes> {
    let response = await this.promptHour(prompts, previousIsFailure);
    while (!response)
      response = await this.promptHour(prompts, true);
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
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.channel.invalid} ${prompts?.base || messages.prompts.channel.base}`
        : prompts?.base || messages.prompts.channel.base,
    );

    const firstMention = response.mentions.channels.first();
    if (response.mentions.channels.size > 0 && firstMention.isText() && isGuildBasedChannel(firstMention))
      return firstMention;

    const query = response.content.split(' ').join('-');
    return CustomResolvers.resolveGuildTextBasedChannel(query, response).value;
  }

  public async promptMessage(prompts?: PrompterText, previousIsFailure = false): Promise<GuildMessage> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.message.invalid} ${prompts?.base || messages.prompts.message.base}`
        : prompts?.base || messages.prompts.message.base,
    );

    return (await Resolvers.resolveMessage(response.content, { message: response })).value as GuildMessage;
  }

  public async promptText(prompts?: PrompterText, previousIsFailure = false): Promise<string> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.text.invalid} ${prompts?.base || messages.prompts.text.base}`
        : prompts?.base || messages.prompts.text.base,
    );

    return Resolvers.resolveString(response.content).value;
  }

  public async promptDate(prompts?: PrompterText, previousIsFailure = false): Promise<Date> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.date.invalid} ${prompts?.base || messages.prompts.date.base}`
        : prompts?.base || messages.prompts.date.base,
    );

    return CustomResolvers.resolveDay(response.content).value;
  }

  public async promptHour(prompts?: PrompterText, previousIsFailure = false): Promise<HourMinutes> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.hour.invalid} ${prompts?.base || messages.prompts.hour.base}`
        : prompts?.base || messages.prompts.hour.base,
    );

    return CustomResolvers.resolveHour(response.content).value;
  }

  public async promptDuration(prompts?: PrompterText, previousIsFailure = false): Promise<number> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.duration.invalid} ${prompts?.base || messages.prompts.duration.base}`
        : prompts?.base || messages.prompts.duration.base,
    );

    return CustomResolvers.resolveDuration(response.content).value;
  }

  public async promptMember(prompts?: PrompterText, previousIsFailure = false): Promise<GuildMember> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.member.invalid} ${prompts?.base || messages.prompts.member.base}`
        : prompts?.base || messages.prompts.member.base,
    );

    if (response.mentions.members.size > 0)
      return response.mentions.members.first();

    return (await Resolvers.resolveMember(response.content, response.guild)).value;
  }

  public async promptRole(prompts?: PrompterText, previousIsFailure = false): Promise<Role> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.role.invalid} ${prompts?.base || messages.prompts.role.base}`
        : prompts?.base || messages.prompts.role.base,
    );

    if (response.mentions.roles.size > 0)
      return response.mentions.roles.first();

    return (await Resolvers.resolveRole(response.content, response.guild)).value;
  }

  public async promptBoolean(prompts?: PrompterText, previousIsFailure = false): Promise<boolean> {
    const response = await this._prompt(
      previousIsFailure
        ? `${prompts?.invalid || messages.prompts.role.invalid} ${prompts?.base || messages.prompts.role.base}`
        : prompts?.base || messages.prompts.role.base,
    );

    return Resolvers.resolveBoolean(response.content, {
      truths: settings.configuration.booleanTruths,
      falses: settings.configuration.booleanFalses,
    }).value;
  }

  private async _prompt(text: string): Promise<GuildMessage> {
    const handler = new MessagePrompter(
      text,
      'message',
      { timeout: 60 * 1000, explicitReturn: true, editMessage: this._options.baseMessage },
    );
    const { response, appliedMessage } = await handler
      .run(this._message.channel, this._message.author) as PrompterMessageResult;
    if (this._options.messageArray)
      this._options.messageArray.addAll(response, appliedMessage);

    if (settings.configuration.stop.has(response.content))
      throw new Error('STOP');
    return response;
  }
}
