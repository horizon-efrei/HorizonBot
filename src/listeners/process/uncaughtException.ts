import { ApplyOptions } from '@sapphire/decorators';
import type { ListenerOptions } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({ emitter: process })
export default class UncaughtExceptionListener extends Listener {
  public run(error: Error): void {
    this.container.logger.fatal(`Uncaught Exception: ${error.name}: ${error.message}`);
    this.container.logger.fatal(error.stack);
    this.container.logger.warn('An Uncaught Exception just occurred. The bot is now in an undefined state. Continuing using it might lead to unforeseen and unpredictable issues.');
  }
}
