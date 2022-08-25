import { Result } from '@sapphire/framework';
import type {
  AwaitMessageCollectorOptionsParams,
  BaseCommandInteraction,
  MappedInteractionTypes,
  MessageComponentInteraction,
  MessageOptions,
} from 'discord.js';
import type { MessageComponentTypes } from 'discord.js/typings/enums';
import { nullop } from '@/utils';

export default class InteractionPrompter {
  private _lastInteraction: MessageComponentInteraction;

  constructor(
    public readonly interaction: BaseCommandInteraction,
  ) {}

  public async send(options: Pick<MessageOptions, 'attachments' | 'components' | 'content' | 'embeds'>): Promise<void> {
    if (this._lastInteraction)
      await this._lastInteraction.update(options);
    else if (this.interaction.replied)
      await this.interaction.editReply(options);
    else
      await this.interaction.reply(options);
  }

  public async awaitMessageComponent<T extends MessageComponentTypes.BUTTON | MessageComponentTypes.SELECT_MENU>(
    options?: AwaitMessageCollectorOptionsParams<T, true>,
  ): Promise<Result<MappedInteractionTypes[T], null>> {
    const interaction = await this.interaction.channel.awaitMessageComponent({
      ...options,
      time: 30_000,
    }).catch(nullop);
    if (!interaction) {
      await this.send({ content: 'Temps écoulé. Commande annulée.', components: [] });
      return Result.err(null);
    }

    this._lastInteraction = interaction;
    return Result.ok(interaction);
  }
}
