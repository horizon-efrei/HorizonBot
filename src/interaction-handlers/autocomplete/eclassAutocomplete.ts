import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import type { EclassDocument } from '@/types/database';
import { EclassStatus } from '@/types/database';
import { trimText } from '@/utils';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class EclassAutocompleteHandler extends InteractionHandler {
  private _cache: EclassDocument[] = [];
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
    if (interaction.commandName !== 'eclass')
      return this.none();

    const focusedOption = interaction.options.getFocused(true);

    await this._updateCache();

    switch (focusedOption.name) {
      case 'id': {
        const subcommandName = interaction.options.getSubcommand(true);

        let pool: EclassDocument[] = [];
        switch (subcommandName) {
          case 'start':
          case 'edit':
            pool = this._cache.filter(eclass => eclass.status === EclassStatus.Planned);
            break;
          case 'finish':
            pool = this._cache.filter(eclass => eclass.status === EclassStatus.InProgress);
            break;
          case 'cancel':
            pool = this._cache
              .filter(eclass => eclass.status === EclassStatus.Planned || eclass.status === EclassStatus.InProgress);
            break;
          case 'record':
            pool = this._cache;
            break;
        }

        const fuzzy = new FuzzySearch(pool, ['classId', 'topic'], { sort: true });
        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map((match) => {
          const title = ` — ${dayjs(match.date).format(settings.configuration.dateFormat)} [${match.classId}]`;
          return {
            name: `${trimText(match.topic, AutoCompleteLimits.MaximumLengthOfNameOfOption - title.length)}${title}`,
            value: match.classId,
          };
        }));
      }
      default:
        return this.none();
    }
  }

  private async _updateCache(): Promise<void> {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 10_000) {
      this._cache = await Eclass.find();
      this._cacheDate = new Date();
    }
  }
}
