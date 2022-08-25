import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import settings from '@/config/settings';
import Reminder from '@/models/reminders';
import type { ReminderDocument } from '@/types/database';
import { trimText } from '@/utils';

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class ReminderAutocompleteHandler extends InteractionHandler {
  private _cache: ReminderDocument[] = [];
  private _cacheDate: Date = null;

  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>,
  ): Promise<void> {
    return interaction.respond(result.slice(0, AutoCompleteLimits.MaximumAmountOfOptions));
  }

  public override async parse(
    interaction: AutocompleteInteraction,
  ): Promise<Option<ApplicationCommandOptionChoiceData[]>> {
    if (interaction.commandName !== 'reminders')
      return this.none();

    const focusedOption = interaction.options.getFocused(true);

    await this._updateCache();

    switch (focusedOption.name) {
      case 'id': {
        const haystack = this._cache.filter(reminder => reminder.userId === interaction.user.id);
        const fuzzy = new FuzzySearch(haystack, ['reminderId', 'date', 'description'], { sort: true });

        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map((match) => {
          const title = ` — ${dayjs(match.date).format(settings.configuration.dateFormat)} [${match.reminderId}]`;
          return {
            name: `${trimText(match.description, AutoCompleteLimits.MaximumLengthOfNameOfOption - title.length)}${title}`,
            value: match.reminderId,
          };
        }));
      }
      default:
        return this.none();
    }
  }

  private async _updateCache(): Promise<void> {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 10_000) {
      this._cache = await Reminder.find();
      this._cacheDate = new Date();
    }
  }
}
