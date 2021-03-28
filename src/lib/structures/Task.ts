import { Events } from '@sapphire/framework';
import type { PieceContext, PieceOptions } from '@sapphire/pieces';
import { Piece } from '@sapphire/pieces';

/**
 * The base task class. This class is abstract and is to be extended by subclasses, which should implement the methods.
 * In our workflow, tasks are ran at the specified interval.
 *
 * @example
 * ```typescript
 * // TypeScript:
 * import { Task, Tasks, PieceContext } from '@/structures/Task';
 *
 * // Define a class extending `Task`, then export it.
 * // NOTE: You can use `export default` or `export =` too.
 * export class MyTask extends Task<Events.Ready> {
 *   public constructor(context: PieceContext) {
 *     super(context, { interval: 10_000 }); // Every 10 seconds
 *   }
 *
 *   public run() {
 *     this.context.logger.info('Task ran!');
 *   }
 * }
 * ```
 */
export default abstract class Task extends Piece {
  public readonly delay: number;
  #schedule: NodeJS.Timeout;
  #callback: (() => Promise<void>) | null;

  constructor(context: PieceContext, options: TaskOptions = {}) {
    super(context, options);

    this.delay = options.delay ?? 10_000;
    this.#callback = this._run.bind(this);
  }

  public onLoad(): void {
    this.#schedule = setInterval(this.#callback, this.delay);
  }

  public onUnload(): void {
    if (this.#schedule)
      clearInterval(this.#schedule);
  }

  public toJSON(): Record<PropertyKey, unknown> {
    return {
      ...super.toJSON(),
      delay: this.delay,
    };
  }

  private async _run(): Promise<void> {
    try {
      await this.run();
    } catch (error: unknown) {
      this.context.client.emit(Events.TaskError, error as Error, { piece: this });
    }
  }

  public abstract run(): unknown;
}

export interface TaskOptions extends PieceOptions {
  readonly delay?: number;
}
