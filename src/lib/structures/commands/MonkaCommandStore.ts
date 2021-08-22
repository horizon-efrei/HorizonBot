import { AliasStore } from '@sapphire/pieces';
import type { Constructor } from '@sapphire/utilities';
import MonkaCommand from './MonkaCommand';

export default class MonkaCommandStore extends AliasStore<MonkaCommand> {
  constructor() {
    super(MonkaCommand as Constructor<MonkaCommand>, { name: 'commands' });
  }
}
