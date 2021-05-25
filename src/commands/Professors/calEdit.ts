import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { editSummaryCalendar as summaryCalConfig, editSummaryCalendar } from '@/config/commands/professors';
import { editYearCalendar as yearCalConfig, editYearCalendar } from '@/config/commands/professors';
import settings from '@/config/settings';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';
import SavedMessages from '@/models/savedMessages'
import { Args } from '@sapphire/framework';

@ApplyOptions<CommandOptions>(summaryCalConfig.options)
export default class SumCalCommand extends MonkaCommand {
  bot = this.context.client;
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const possibleActions: { [id: string] : (message: GuildMessage, args: Args) => Promise<void>; } = {"add": this.add, "remove": this.remove,
    "edit": this.edit, "create": this.create, "archive": this.archive, "reset": this.reset, "help": this.help};

    if (!message.member.roles.cache.has(settings.roles.eprof)) {
      await message.channel.send(summaryCalConfig.messages.onlyProfessor);
      return;
    }
    
    const getAction = await args.pickResult('string');
    if (getAction.error || !Object.keys(possibleActions).includes(getAction.value)) {
      await message.channel.send(summaryCalConfig.messages.prompts.action.invalid);
      return;
    }

    await possibleActions[getAction.value](message, args);
    return;
  }

  public async edit(message: GuildMessage, args: Args): Promise<void> {
    const getChannel = await args.pickResult('string');
    if (getChannel.error) {
      await message.channel.send(summaryCalConfig.messages.prompts.channel.invalid);
      return;
    }

    const channel = getChannel.value;

    // Fetch message corresponding to channel (the saved message must have the same name as the channel's name)
    const calendarMessage = await SavedMessages.findOne({"name": channel}).exec();
    
    if (calendarMessage === null) {
      this.context.logger.warn(`[ycal] No calendar message found for group "${channel}", create a calendar message in the desired channel using "${settings.prefix}caledit create"`);
      await message.channel.send(`Pas de calendrier trouvé pour le groupe "${channel}"`);
      return;

    } else {
      
      // Calendrier trouvé ! Commencer décodage de la commande

    }
  }

  public async add(message: GuildMessage, args: Args): Promise<void> {
    
  }

  public async remove(message: GuildMessage, args: Args): Promise<void> {
    
  }

  public async create(message: GuildMessage, args: Args): Promise<void> {
    
  }

  public async archive(message: GuildMessage, args: Args): Promise<void> {
    
  }

  public async reset(message: GuildMessage, args: Args): Promise<void> {
    
  }

  public async help(message: GuildMessage, args: Args): Promise<void> {
    
  }
}

