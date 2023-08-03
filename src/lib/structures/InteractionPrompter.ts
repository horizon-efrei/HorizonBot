import { Result } from '@sapphire/framework';
import type {
  AwaitMessageCollectorOptionsParams,
  BaseMessageOptions,
  CommandInteraction,
  ComponentType,
  MappedInteractionTypes,
  MessageComponentInteraction,
} from 'discord.js';
import { nullop } from '@/utils';

export class InteractionPrompter {
  private _lastInteraction: MessageComponentInteraction;

  constructor(
    public readonly interaction: CommandInteraction,
  ) {}

  public async send(options: Pick<BaseMessageOptions, 'components' | 'content' | 'embeds' | 'files'>): Promise<void> {
    if (this._lastInteraction)
      await this._lastInteraction.update(options);
    else if (this.interaction.replied)
      await this.interaction.editReply(options);
    else
      await this.interaction.reply(options);
  }

  public async awaitMessageComponent<T extends ComponentType.Button | ComponentType.StringSelect>(
    options?: AwaitMessageCollectorOptionsParams<T, true>,
  ): Promise<Result<MappedInteractionTypes[T], null>> {
    const interaction = await this.interaction.channel!.awaitMessageComponent({
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
