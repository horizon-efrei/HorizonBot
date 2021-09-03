import type { Result } from '@sapphire/framework';
import { container, err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type HorizonCommand from '@/structures/commands/HorizonCommand';
import type HorizonCommandStore from '@/structures/commands/HorizonCommandStore';

export default function resolveCommand(parameter: string): Result<HorizonCommand, 'commandError'> {
  const command = (container.stores
    .get('commands') as HorizonCommandStore)
    .find(cmd => cmd.aliases.includes(parameter));

  if (isNullish(command))
    return err('commandError');
  return ok(command);
}
