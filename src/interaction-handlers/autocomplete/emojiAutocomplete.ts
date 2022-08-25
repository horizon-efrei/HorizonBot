import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import emoji from 'node-emoji';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class EmojiAutocompleteHandler extends InteractionHandler {
  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>,
  ): Promise<void> {
    return interaction.respond(result.slice(0, AutoCompleteLimits.MaximumAmountOfOptions));
  }

  public override parse(interaction: AutocompleteInteraction): Option<ApplicationCommandOptionChoiceData[]> {
    const focusedOption = interaction.options.getFocused(true);
    if (!focusedOption.name.includes('emoji'))
      return this.none();

    const results = emoji.search(focusedOption.value);
    return this.some(results.map(match => ({
      name: `${match.emoji} (${match.key})`,
      value: match.emoji,
    })));
  }
}
