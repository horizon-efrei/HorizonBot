import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { latex as config } from '@/config/commands/general';
import settings from '@/config/settings';
import HorizonCommand from '@/structures/commands/HorizonCommand';

@ApplyOptions<CommandOptions>(config.options)
export default class LatexCommand extends HorizonCommand {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const equation = await args.restResult('string');
    if (equation.error) {
      await message.channel.send(config.messages.noEquationGiven);
      return;
    }

    await message.channel.send(settings.apis.latex + encodeURIComponent(equation.value));
  }
}
