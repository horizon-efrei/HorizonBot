import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import pupa from 'pupa';
import { pingRoleIntersection as config } from '@/config/commands/admin';
import MonkaCommand from '@/structures/commands/MonkaCommand';
import type { GuildMessage } from '@/types';

@ApplyOptions<CommandOptions>({
  ...config.options,
  strategyOptions: {
    flags: ['keep'],
  },
})
export default class PingRoleIntersectionCommand extends MonkaCommand {
  public async run(message: GuildMessage, args: Args): Promise<void> {
    const isPersistent = args.getFlags('keep');

    const allRoles = await args.repeatResult('role');
    if (allRoles.error) {
      await message.channel.send(pupa(config.messages.roleDoesntExist, { role: allRoles.error.parameter }));
      return;
    }

    if (allRoles.value.length < 2) {
      await message.channel.send(config.messages.notEnoughRoles);
      return;
    }

    await message.guild.members.fetch();
    const targetedMembers = message.guild.members.cache
      .filter(member => allRoles.value.every(role => member.roles.cache.has(role.id)));

    if (targetedMembers.size === 0) {
      await message.channel.send(pupa(config.messages.noTargetedUsers, { num: allRoles.value.length }));
      return;
    }

    const newRole = await message.guild.roles.create({
      name: `${allRoles.value.map(r => r.name).join(' + ')}`,
      hoist: false,
      mentionable: true,
      reason: `${message.author.username} a éxecuté la commande PingRoleIntersection`,
    });

    for (const [, member] of targetedMembers)
      await member.roles.add(newRole);
    await message.channel.send(
      pupa(
        isPersistent ? config.messages.successPersistent : config.messages.successTemporary,
        { newRole, targetedMembers },
      ),
    );

    if (!isPersistent)
      this.context.client.intersectionRoles.add(newRole.id);
  }
}
