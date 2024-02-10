import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import { Faq } from '@/models/faq';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class FaqAutocompleteHandler extends InteractionHandler {
  private _cache: string[] = [];
  private _cacheDate: Date | null = null;

  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>,
  ): Promise<void> {
    return interaction.respond(result.slice(0, AutoCompleteLimits.MaximumAmountOfOptions));
  }

  public override async parse(
    interaction: AutocompleteInteraction<'cached'>,
  ): Promise<Option<ApplicationCommandOptionChoiceData[]>> {
    if (!['manage-faq', 'faq'].includes(interaction.commandName))
      return this.none();

    const focusedOption = interaction.options.getFocused(true);

    await this._updateCache(interaction.guildId);

    switch (focusedOption.name) {
      case 'nom': {
        const fuzzy = new FuzzySearch(this._cache, [], { sort: true });

        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map(match => ({ name: match, value: match })));
      }
      default:
        return this.none();
    }
  }

  private async _updateCache(guildId: string): Promise<void> {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 10_000) {
      const questions = await Faq.find({ guildId });
      this._cache = questions.map(t => t.name);
      this._cacheDate = new Date();
    }
  }
}
