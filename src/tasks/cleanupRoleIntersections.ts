import { ApplyOptions } from '@sapphire/decorators';
import RoleIntersections from '@/models/roleIntersections';
import Task from '@/structures/Task';
import type { TaskOptions } from '@/structures/Task';

@ApplyOptions<TaskOptions>({ cron: '0 * * * *' })
export default class CleanupRoleIntersectionsTask extends Task {
  public async run(): Promise<void> {
    const roles = (await RoleIntersections.find({ expiration: { $lte: Date.now() } }))
      .map(({ guildId, roleId }) => this.context.client.guilds.resolve(guildId).roles.resolve(roleId));

    if (roles.length > 0) {
      this.context.logger.debug(`[Intersection Roles] Removed ${roles.length} role ("${roles.map(r => r.name).join('", "')}") as it was mentionned and has expired.`);
      for (const role of roles)
        await role.delete();
    }
  }
}
