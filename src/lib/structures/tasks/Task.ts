import type { PieceContext, PieceJSON, PieceOptions } from '@sapphire/pieces';
import { Piece } from '@sapphire/pieces';
import cron from 'node-cron';
import type { Object } from 'ts-toolbelt';
import { Events } from '@/types/sapphire';

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
 * // You can use a interval in milliseconds
 * @ApplyOptions<TaskOptions>({ interval: 10_000 })
 * // or a cron
 * @ApplyOptions<TaskOptions>({ cron: '* * * * *' })
 * export default class MyTask extends Task {
 *   public run(): void {
 *     this.container.logger.info('Task ran!');
 *   }
 * }
 * ```
 */
export default abstract class Task extends Piece {
  public readonly interval?: number;
  public readonly cron?: string;

  private _scheduleInterval: NodeJS.Timeout;
  private _scheduleCron: cron.ScheduledTask;
  private readonly _callback: (() => Promise<void>) | null;

  constructor(context: PieceContext, options: TaskOptions) {
    super(context, options);

    this.interval = options.interval;
    this.cron = options.cron;
    this._callback = this._run.bind(this);
  }

  public onLoad(): void {
    if (this.interval)
      this._scheduleInterval = setInterval(this._callback, this.interval);
    else if (this.cron)
      this._scheduleCron = cron.schedule(this.cron, this._callback);
  }

  public onUnload(): void {
    if (this._scheduleInterval)
      clearInterval(this._scheduleInterval);
    if (this._scheduleCron)
      this._scheduleCron.stop();
  }

  public toJSON(): PieceJSON & { interval: number | undefined; cron: string | undefined } {
    return {
      ...super.toJSON(),
      interval: this.interval,
      cron: this.cron,
    };
  }

  private async _run(): Promise<void> {
    try {
      await this.run();
    } catch (error: unknown) {
      this.container.client.emit(Events.TaskError, error as Error, { piece: this });
    }
  }

  public abstract run(): unknown;
}

export type TaskOptions = Object.Either<PieceOptions & { cron: string; interval: number }, 'cron' | 'interval'>;
