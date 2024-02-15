import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import type { SubjectEntry } from '@/types/database';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class SubjectsAutocompleteHandler extends InteractionHandler {
  private _cache: SubjectEntry[] = [];
  private _cacheDate: Date | null = null;

  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>,
  ): Promise<void> {
    return interaction.respond(result.slice(0, AutoCompleteLimits.MaximumAmountOfOptions));
  }

  public override parse(
    interaction: AutocompleteInteraction,
  ): Option<ApplicationCommandOptionChoiceData[]> {
    const focusedOption = interaction.options.getFocused(true);
    if (!focusedOption.name.includes('matière'))
      return this.none();

    this._updateCache();
    const fuzzy = new FuzzySearch(this._cache, ['name', 'nameEnglish', 'slug', 'classCode'], { sort: true });

    const results = fuzzy.search(focusedOption.value);
    return this.some(results.map(match => ({
      name: `${match.name} (${match.classCode})`,
      value: match.classCode,
    })));
  }

  private _updateCache(): void {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 60_000) {
      this._cache = this.container.subjectsManager.rows.filter(row => row.active);
      this._cacheDate = new Date();
    }
  }
}
