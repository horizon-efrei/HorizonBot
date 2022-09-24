import { ApplyOptions } from '@sapphire/decorators';
import { AutoCompleteLimits } from '@sapphire/discord-utilities';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, TextChannel } from 'discord.js';
import FuzzySearch from 'fuzzy-search';
import ReactionRole from '@/models/reactionRole';
import { makeMessageLink, trimText } from '@/utils';

interface CachedReactionRole {
  messageUrl: string;
  title: string;
  channelName: string;
}

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Autocomplete,
})
export class ReactionRoleAutocompleteHandler extends InteractionHandler {
  private _cache: CachedReactionRole[] = [];
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
    if (interaction.commandName !== 'reaction-role')
      return this.none();

    const focusedOption = interaction.options.getFocused(true);

    await this._updateCache(interaction.guildId);

    switch (focusedOption.name) {
      case 'message-url': {
        const fuzzy = new FuzzySearch(this._cache, ['title', 'channelName', 'messageUrl'], { sort: true });

        const results = fuzzy.search(focusedOption.value);
        return this.some(results.map(match => ({
          name: trimText(`${match.title} (dans #${match.channelName})`, AutoCompleteLimits.MaximumLengthOfNameOfOption),
          value: match.messageUrl,
        })));
      }
      default:
        return this.none();
    }
  }

  private async _updateCache(guildId: string): Promise<void> {
    if (!this._cacheDate || this._cacheDate.getTime() < Date.now() - 30_000) {
      const documents = await ReactionRole.find({ guildId });
      this._cache = [];
      for (const document of documents) {
        const channel = this.container.client.guilds.cache.get(document.guildId)
          ?.channels.cache.get(document.channelId) as TextChannel;
        if (!channel)
          continue;
        const message = await channel.messages.fetch(document.messageId);

        this._cache.push({
          messageUrl: makeMessageLink(document.guildId, document.channelId, document.messageId),
          channelName: channel.name,
          title: message.embeds[0].title ?? 'Titre inconnu',
        });
      }
      this._cacheDate = new Date();
    }
  }
}
