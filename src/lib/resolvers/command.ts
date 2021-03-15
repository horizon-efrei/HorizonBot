import {
  Args,
  err,
  ok,
  UserError,
} from '@sapphire/framework';
import type MonkaCommand from '@/structures/MonkaCommand';
import type MonkaCommandStore from '@/structures/MonkaCommandStore';

const commandResolver = Args.make<MonkaCommand>((param, context) => {
  const command = (context.command.context.stores
    .get('commands') as MonkaCommandStore)
    .find(cmd => cmd.aliases.includes(param));
  return command ? ok(command) : err(new UserError({ identifier: 'InvalidCommand' }));
}, 'command');

export default commandResolver;
