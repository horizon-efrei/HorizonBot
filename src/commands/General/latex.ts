import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { latex as config } from '@/config/commands/general';
import settings from '@/config/settings';
import MonkaCommand from '@/structures/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>(config.options)
export default class LatexCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const equation = await args.restResult('string');
    if (equation.error) {
      await message.channel.send(config.messages.noEquationGiven);
      return;
    }

    await message.channel.send(settings.apis.latex + encodeURIComponent(equation.value));
  }
}
