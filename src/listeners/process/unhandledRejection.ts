import { ApplyOptions } from '@sapphire/decorators';
import type { ListenerOptions } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({ emitter: process })
export default class UnhandledRejectionListener extends Listener {
  public run(error: unknown, promise: PromiseRejectedResult): void {
    if (error instanceof Error) {
      this.container.logger.fatal(`Unhandled Rejection: ${error.name}: ${error.message} (reason: ${promise.reason})`);
      this.container.logger.fatal(error.stack);
    } else {
      this.container.logger.fatal(`Unhandled Rejection: ${JSON.stringify(error)} (reason: ${promise.reason})`);
    }
    this.container.logger.warn('An Unhandled Rejection just occurred. The bot is now in an undefined state. Continuing using it might lead to unforeseen and unpredictable issues.');
  }
}
