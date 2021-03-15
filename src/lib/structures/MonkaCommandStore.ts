import type { Constructor } from '@sapphire/pieces';
import { AliasStore } from '@sapphire/pieces';
import MonkaCommand from './MonkaCommand';

export default class MonkaCommandStore extends AliasStore<MonkaCommand> {
  constructor() {
    super(MonkaCommand as Constructor<MonkaCommand>, { name: 'commands' });
  }
}
