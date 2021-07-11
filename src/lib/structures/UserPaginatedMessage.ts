// Source: https://github.com/skyra-project/skyra/blob/439c93f9537a3fee2dc3c26707e4017ea5ad9936/typescript/src/lib/structures/UserPaginatedMessage.ts

import type { MessagePage, PaginatedMessageOptions } from '@sapphire/discord.js-utilities';
import { MessageBuilder, PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Time } from '@sapphire/time-utilities';
import type { RESTPostAPIChannelMessageJSONBody } from 'discord-api-types';
import type {
  MessageEmbedOptions,
  MessageOptions,
  NewsChannel,
  TextChannel,
  User,
} from 'discord.js';
import { APIMessage, MessageEmbed } from 'discord.js';
import messages from '@/config/messages';
import type { GuildMessage } from '@/types';

type EmbedResolvable = MessageOptions['embed'];

function mergeArrays<T>(template?: T[], array?: T[]): T[] | undefined {
  if (!array)
    return template;
  if (!template)
    return array;
  return [...template, ...array];
}

function mergeEmbeds(
  template: MessageEmbed | MessageEmbedOptions,
  embed: MessageEmbed | MessageEmbedOptions,
): MessageEmbedOptions {
  return {
    /* eslint-disable no-undefined */
    title: embed.title ?? template.title ?? undefined,
    description: embed.description ?? template.description ?? undefined,
    url: embed.url ?? template.url ?? undefined,
    timestamp: embed.timestamp ?? template.timestamp ?? undefined,
    color: embed.color ?? template.color ?? undefined,
    fields: mergeArrays(template.fields, embed.fields),
    files: mergeArrays(template.files, embed.files),
    author: embed.author ?? template.author ?? undefined,
    thumbnail: embed.thumbnail ?? template.thumbnail ?? undefined,
    image: embed.image ?? template.image ?? undefined,
    video: embed.video ?? template.video ?? undefined,
    footer: embed.footer ?? template.footer ?? undefined,
    /* eslint-enable no-undefined */
  };
}

function applyTemplateEmbed(
  template: EmbedResolvable,
  embed: EmbedResolvable,
): MessageEmbed | MessageEmbedOptions | undefined {
  if (!embed)
    return template;
  if (!template)
    return embed;
  return mergeEmbeds(template, embed);
}

function applyTemplate(template: MessageOptions, options: MessageOptions): MessageOptions {
  return { ...template, ...options, embed: applyTemplateEmbed(template.embed, options.embed) };
}

export default class UserPaginatedMessage extends PaginatedMessage {
  public static readonly messages = new Map<string, UserPaginatedMessage>();
  public static readonly handlers = new Map<string, UserPaginatedMessage>();

  public template: MessageOptions;

  constructor(options: UserPaginatedMessageOptions = {}) {
    super(options);
    this.setIdle(Time.Minute * 5);
    this.setPromptMessage(messages.miscellaneous.paginatedMessagePrompt);
    this.template = UserPaginatedMessage._resolveTemplate(options.template);
  }

  private static _resolveTemplate(template?: MessageEmbed | MessageOptions): MessageOptions {
    if (!template)
      return {};
    if (template instanceof MessageEmbed)
      return { embed: template };
    return template;
  }

  public async start(message: GuildMessage, target = message.author): Promise<this> {
    // Stop the previous display and cache the new one
    const display = UserPaginatedMessage.handlers.get(target.id);
    if (display)
      display.collector.stop();

    // If the message was sent by Skyra, set the response as this one
    if (message.author.bot)
      this.response = message;

    const handler = await this.run(target, message.channel);
    const messageID = handler.response.id;

    if (this.collector) {
      this.collector.once('end', () => {
        UserPaginatedMessage.messages.delete(messageID);
        UserPaginatedMessage.handlers.delete(target.id);
      });

      UserPaginatedMessage.messages.set(messageID, handler);
      UserPaginatedMessage.handlers.set(target.id, handler);
    }

    return handler;
  }

  /**
   * This clones the current handler into a new instance.
   */
  public clone(): UserPaginatedMessage {
    const clone = super.clone() as UserPaginatedMessage;
    clone.template = this.template;
    return clone;
  }

  public addPageBuilder(cb: (builder: MessageBuilder) => MessageBuilder): this {
    return this.addPage(cb(new MessageBuilder()));
  }

  public addPageContent(content: string): this {
    return this.addPage({ content });
  }

  public addPageEmbed(cb: MessageEmbed | ((builder: MessageEmbed) => MessageEmbed)): this {
    return this.addPage({ embed: typeof cb === 'function' ? cb(new MessageEmbed()) : cb });
  }

  /**
   * Sets up the message's reactions and the collector.
   * @param channel The channel the handler is running at.
   * @param author The author the handler is for.
   */
  protected async setUpReactions(channel: NewsChannel | TextChannel, author: User): Promise<void> {
    if (this.pages.length > 1)
      await super.setUpReactions(channel, author);
  }

  /**
   * Handles the load of a page.
   * @param page The page to be loaded.
   * @param channel The channel the paginated message runs at.
   * @param index The index of the current page.
   */
  protected async handlePageLoad(
    page: MessagePage,
    channel: NewsChannel | TextChannel,
    index: number,
  ): Promise<APIMessage> {
    const options = typeof page === 'function' ? await page(index, this.pages, this) : page;
    const resolved = options instanceof APIMessage
      ? options
      : new APIMessage(channel, applyTemplate(this.template, options));
    return this._applyFooter(resolved.resolveData(), index);
  }

  private _applyFooter(message: APIMessage, index: number): APIMessage {
    const data = message.data as RESTPostAPIChannelMessageJSONBody;
    if (!data.embed)
      return message;

    data.embed.footer ??= { text: this.template.embed?.footer?.text ?? '' };
    data.embed.footer.text = `${index + 1} / ${this.pages.length}${data.embed.footer.text}`;
    return message;
  }
}

export interface UserPaginatedMessageOptions extends PaginatedMessageOptions {
  template?: MessageEmbed | MessageOptions;
}
