/* eslint-disable @typescript-eslint/member-ordering */
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import { Args } from '@sapphire/framework';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { MessageEmbed } from 'discord.js';
import intersection from 'lodash.intersection';
import pupa from 'pupa';
import { tags as config } from '@/config/commands/admin';
import settings from '@/config/settings';
import { IsStaff, ResolveTagArgument } from '@/decorators';
import Tags from '@/models/tags';
import ArgumentPrompter from '@/structures/ArgumentPrompter';
import HorizonSubCommand from '@/structures/commands/HorizonSubCommand';
import { GuildMessage } from '@/types';
import { TagDocument } from '@/types/database';
import { generateSubcommands, inlineCodeList } from '@/utils';

const embedFlags = ['embed', 'e'];

@ApplyOptions<SubCommandPluginCommandOptions>({
  ...config.options,
  generateDashLessAliases: true,
  flags: [...embedFlags],
  subCommands: generateSubcommands(['create', 'list', 'edit', 'remove', 'help'], {
    rename: {},
    alias: { aliases: ['aliases'] },
    embed: { aliases: ['inembed', 'in-embed', 'set-embed'] },
  }),
})
export default class TagsCommand extends HorizonSubCommand {
  @IsStaff()
  public async create(message: GuildMessage, args: Args): Promise<void> {
    const isEmbed = args.getFlags(...embedFlags);
    let name: string = (await args.pickResult('string')).value;
    let content: string = (await args.restResult('string')).value;

    // 1. Ask all the necessary questions
    try {
      const prompter = new ArgumentPrompter(message);

      name ||= (await prompter.promptText(config.messages.prompts.name));
      name = name.toLowerCase();
      if (!this._isValid([name], message.guild.id)) {
        await message.channel.send(config.messages.invalidTag);
        return;
      }

      content ||= await prompter.promptText(config.messages.prompts.content);
    } catch (error: unknown) {
      if ((error as Error).message === 'STOP') {
        await message.channel.send(config.messages.stoppedPrompting);
        return;
      }
      throw error;
    }

    // 2. Add it to the database
    await Tags.create({
      name,
      content,
      isEmbed,
      guildId: message.guild.id,
    });
    await message.channel.send(config.messages.createdTag);
  }

  public async list(message: GuildMessage, _args: Args): Promise<void> {
    const tags = this.container.client.tags.filter(tag => tag.guildId === message.guild.id);
    if (!tags || tags.size === 0) {
      await message.channel.send(config.messages.noTags);
      return;
    }

    await new PaginatedFieldMessageEmbed<{ name: string; aliases: string; uses: number }>()
      .setTitleField(pupa(config.messages.listTitle, { total: tags.size }))
      .setTemplate(new MessageEmbed().setColor(settings.colors.default))
      .setItems([
        ...tags.map(tag => ({
          name: tag.name,
          aliases: tag.aliases.length > 0 ? inlineCodeList(tag.aliases) : '/',
          uses: tag.uses,
        })),
      ])
      .formatItems(item => pupa(config.messages.listLine, item))
      .setItemsPerPage(10)
      .make()
      .run(message);
  }

  @IsStaff()
  @ResolveTagArgument()
  public async edit(message: GuildMessage, args: Args, tag: TagDocument): Promise<void> {
    tag.content = (await args.restResult('string')).value
      || await new ArgumentPrompter(message).promptText(config.messages.prompts.content);
    await tag.save();
    await message.channel.send(config.messages.editedTag);
  }

  @IsStaff()
  @ResolveTagArgument()
  public async rename(message: GuildMessage, args: Args, tag: TagDocument): Promise<void> {
    const newName = (await args.pickResult('string')).value
      || (await new ArgumentPrompter(message).promptText(config.messages.prompts.newName)).split(' ').shift();
    if (!this._isValid([newName], message.guild.id)) {
      await message.channel.send(config.messages.invalidTag);
      return;
    }

    tag.name = newName;
    await tag.save();
    await message.channel.send(config.messages.editedTag);
  }

  @IsStaff()
  @ResolveTagArgument()
  public async alias(message: GuildMessage, args: Args, tag: TagDocument): Promise<void> {
    const rawValue = (await args.restResult('string')).value
      || await new ArgumentPrompter(message).promptText(config.messages.prompts.aliases);

    if (rawValue === 'clear') {
      tag.aliases = [];
    } else {
      const aliases = rawValue.split(', ').map(alias => alias.split(' ').shift());
      if (!this._isValid(aliases, message.guild.id)) {
        await message.channel.send(config.messages.invalidAliases);
        return;
      }
      tag.aliases = aliases;
    }

    await tag.save();
    await message.channel.send(config.messages.editedTag);
  }

  @IsStaff()
  @ResolveTagArgument()
  public async embed(message: GuildMessage, args: Args, tag: TagDocument): Promise<void> {
    const isEmbed = await args.pickResult('boolean');

    const inOrWithout = (inEmbed: boolean): string => config.messages[inEmbed ? 'inEmbed' : 'withoutEmbed'];

    if (isEmbed.error) {
      await message.channel.send(pupa(config.messages.showTagEmbed, { inOrWithout: inOrWithout(tag.isEmbed) }));
      return;
    }

    tag.isEmbed = isEmbed.value;
    await tag.save();
    await message.channel.send(pupa(config.messages.editedTagEmbed, { inOrWithout: inOrWithout(tag.isEmbed) }));
  }

  @IsStaff()
  @ResolveTagArgument()
  public async remove(message: GuildMessage, _args: Args, tag: TagDocument): Promise<void> {
    await tag.remove();
    await message.channel.send(config.messages.removedTag);
  }

  public async help(message: GuildMessage, _args: Args): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle(config.messages.helpEmbedTitle)
      .addFields([...config.messages.helpEmbedDescription])
      .setColor(settings.colors.default);

    await message.channel.send({ embeds: [embed] });
  }

  private _isValid(names: string[], guildId: string): boolean {
    const lowerNames = names.map(name => name.toLowerCase());
    const tags = this.container.client.tags.filter(tag => tag.guildId === guildId);

    for (const tag of tags) {
      if (lowerNames.includes(tag.name.toLowerCase()))
        return false;
      const lowerAliases = tag.aliases.map(alias => alias.toLowerCase());
      if (intersection(lowerAliases, lowerNames).length > 0)
        return false;
    }
    return true;
  }
}
