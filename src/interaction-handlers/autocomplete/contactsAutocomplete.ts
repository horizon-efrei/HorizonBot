import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import Contact from '@/models/contact';
import type { ContactDocument } from '@/types/database';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class ContactsAutocompleteHandler extends InteractionHandler {
  private _cache: ContactDocument[] = [];
  private _cacheDate: Date | null = null;

  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>,
  ): Promise<void> {
    return interaction.respond(result.slice(0, AutoCompleteLimits.MaximumAmountOfOptions));
  }

  public override async parse(
    interaction: AutocompleteInteraction,
  ): Promise<Option<ApplicationCommandOptionChoiceData[]>> {
    if (interaction.commandName !== 'contacts')
      return this.none();

    const focusedOption = interaction.options.getFocused(true);

    await this._updateCache();

    switch (focusedOption.name) {
      case 'name': {
        const fuzzy = new FuzzySearch(this._cache, ['name'], { sort: true });

        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map(match => ({
          name: `${match.name} (${match.contact}) - ${match.team}`,
          value: match.name,
        })));
      }
      case 'team': {
        const teams = this._cache.map(contact => contact.team);
        const fuzzy = new FuzzySearch(teams, [], { sort: true });

        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map(match => ({ name: match, value: match })));
      }
      default:
        return this.none();
    }
  }

  private async _updateCache(): Promise<void> {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 10_000) {
      this._cache = await Contact.find();
      this._cacheDate = new Date();
    }
  }
}
