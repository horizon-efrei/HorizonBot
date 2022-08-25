import { ApplyOptions } from '@sapphire/decorators';
import { latex as config } from '@/config/commands/general';
import settings from '@/config/settings';
import { HorizonCommand } from '@/structures/commands/HorizonCommand';

enum Options {
  Equation = 'equation',
}

@ApplyOptions<HorizonCommand.Options>(config)
export default class LatexCommand extends HorizonCommand<typeof config> {
  public override registerApplicationCommands(registry: HorizonCommand.Registry): void {
    registry.registerChatInputCommand(
      command => command
        .setName(this.descriptions.name)
        .setDescription(this.descriptions.command)
        .setDMPermission(true)
        .addStringOption(
          option => option
            .setName(Options.Equation)
            .setDescription(this.descriptions.options.equation),
        ),
    );
  }

  public async chatInputRun(interaction: HorizonCommand.ChatInputInteraction): Promise<void> {
    const equation = interaction.options.getString(Options.Equation, true);
    await interaction.reply(settings.apis.latex + encodeURIComponent(equation));
  }
}
