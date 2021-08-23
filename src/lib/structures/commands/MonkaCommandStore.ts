import { AliasStore } from '@sapphire/pieces';
import type { Constructor } from '@sapphire/utilities';
import MonkaCommand from '@/structures/commands/MonkaCommand';

export default class MonkaCommandStore extends AliasStore<MonkaCommand> {
  constructor() {
    super(MonkaCommand as Constructor<MonkaCommand>, { name: 'commands' });
  }
}
