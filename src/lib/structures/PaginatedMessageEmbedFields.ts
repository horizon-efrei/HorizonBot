/**
 * @credits This class is adapted from the PaginatedFieldMessageEmbed class, proposed by
 * kaname-png in this PR: https://github.com/sapphiredev/utilities/pull/144
 *
 * SPDX-License-Identifier: MIT
 */

import type { PaginatedMessageOptions, PaginatedMessagePage } from '@sapphire/discord.js-utilities';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import type { EmbedField, MessageEmbedOptions } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { MessageComponentTypes } from 'discord.js/typings/enums';
import pupa from 'pupa';
import type { List, Number } from 'ts-toolbelt';
import messages from '@/config/messages';
import settings from '@/config/settings';

type EmbedFields = Array<Omit<EmbedField, 'inline'>>;

export default class PaginatedMessageEmbedFields extends PaginatedMessage {
  private _embedTemplate: MessageEmbed = new MessageEmbed();
  private _totalPages = 0;
  private _items: EmbedFields = [];
  private _itemsPerPage = 10;

  constructor(options?: PaginatedMessageOptions) {
    super(options);
    this.setWrongUserInteractionReply(user => ({
      content: pupa(messages.miscellaneous.wrongUserInteractionReply, { user }),
      ephemeral: true,
      allowedMentions: { users: [], roles: [] },
    }));
  }

  public setItems(items: EmbedFields): this {
    this._items = items;
    return this;
  }

  public setItemsPerPage(itemsPerPage: List.UnionOf<Number.Range<0, 25>>): this {
    this._itemsPerPage = itemsPerPage;
    return this;
  }

  public setTemplate(template: MessageEmbed | MessageEmbedOptions): this {
    this._embedTemplate = template instanceof MessageEmbed ? template : new MessageEmbed(template);
    return this;
  }

  public override addPage(page: PaginatedMessagePage): this {
    if (this.pages.length === 25) {
      const actions = PaginatedMessage.defaultActions.filter(action =>
        action.type !== MessageComponentTypes.SELECT_MENU);
      this.setActions(actions);
    }

    this.pages.push(page);
    return this;
  }

  public make(): this {
    this._totalPages = Math.ceil(this._items.length / this._itemsPerPage);
    this._generatePages();
    return this;
  }

  private _generatePages(): void {
    const template = this._embedTemplate instanceof MessageEmbed
      ? this._embedTemplate.toJSON()
      : this._embedTemplate;
    for (let i = 0; i < this._totalPages; i++) {
      const clonedTemplate = new MessageEmbed(template);
      const fieldsClone = this._embedTemplate.fields;
      clonedTemplate.fields = [];

      if (!clonedTemplate.color)
        clonedTemplate.setColor(settings.colors.default);

      const data = this._paginateArray(this._items, i, this._itemsPerPage);
      this.addPage({
        embeds: [clonedTemplate.addFields(...data).addFields(fieldsClone)],
      });
    }
  }

  private _paginateArray(items: EmbedFields, currentPage: number, perPageItems: number): EmbedFields {
    const offset = currentPage * perPageItems;
    return items.slice(offset, offset + perPageItems);
  }
}
