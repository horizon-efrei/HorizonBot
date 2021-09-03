import { AliasStore } from '@sapphire/pieces';
import type { Constructor } from '@sapphire/utilities';
import HorizonCommand from '@/structures/commands/HorizonCommand';

export default class HorizonCommandStore extends AliasStore<HorizonCommand> {
  constructor() {
    super(HorizonCommand as Constructor<HorizonCommand>, { name: 'commands' });
  }
}
