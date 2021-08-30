import { ApplyOptions } from '@sapphire/decorators';
import type { ListenerOptions } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({ emitter: process })
export default class WarningListener extends Listener {
  public run(warning: Error): void {
    this.container.logger.warn(`${warning.name}: ${warning.message}`);
  }
}
