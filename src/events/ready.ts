import { ApplyOptions } from '@sapphire/decorators';
import type { EventOptions } from '@sapphire/framework';
import { Event } from '@sapphire/framework';

@ApplyOptions<EventOptions>({ once: true })
export default class ReadyEvent extends Event {
  public run(): void {
    this.context.client.checkValidity();
  }
}
