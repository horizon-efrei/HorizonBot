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
 * import { Task } from '@/structures/Task';
 * import type { TaskOptions } from '@/structures/Task';
 *
 * // Define a class extending `Task`, then export it.
 * @ApplyOptions<TaskOptions>({ delay: 10_000 })
 * export default class MyTask extends Task {
 *   public run(): void {
 *     this.context.logger.info('Task ran!');
 *   }
 * }
 * ```
 */
export default abstract class Task extends Piece {
  public readonly delay: number;

  private _schedule: NodeJS.Timeout;
  private readonly _callback: (() => Promise<void>) | null;

  constructor(context: PieceContext, options: TaskOptions = {}) {
    super(context, options);

    this.delay = options.delay ?? 10_000;
    this._callback = this._run.bind(this);
  }

  public onLoad(): void {
    this._schedule = setInterval(this._callback, this.delay);
  }

  public onUnload(): void {
    if (this._schedule)
      clearInterval(this._schedule);
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
