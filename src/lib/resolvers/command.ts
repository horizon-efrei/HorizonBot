import type { Result } from '@sapphire/framework';
import { container, err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type HorizonCommand from '@/structures/commands/HorizonCommand';

export default function resolveCommand(parameter: string): Result<HorizonCommand, 'commandError'> {
  const command = container.stores.get('commands')
    .find(cmd => cmd.aliases.includes(parameter));

  if (isNullish(command))
    return err('commandError');
  return ok(command as HorizonCommand);
}
