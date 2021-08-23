import type { Result } from '@sapphire/framework';
import { container, err, ok } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type MonkaCommandStore from '../structures/commands/MonkaCommandStore';
import type MonkaCommand from '@/structures/commands/MonkaCommand';

export default function resolveCommand(parameter: string): Result<MonkaCommand, 'commandError'> {
  const command = (container.stores
    .get('commands') as MonkaCommandStore)
    .find(cmd => cmd.aliases.includes(parameter));

  if (isNullish(command))
    return err('commandError');
  return ok(command);
}
