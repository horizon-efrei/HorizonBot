import { ApplyOptions } from '@sapphire/decorators';
import { filterNullAndUndefined } from '@sapphire/utilities';
import RoleIntersections from '@/models/roleIntersections';
import Task from '@/structures/tasks/Task';
import type { TaskOptions } from '@/structures/tasks/Task';

@ApplyOptions<TaskOptions>({ cron: '0 * * * *' })
export default class CleanupRoleIntersectionsTask extends Task {
  public async run(): Promise<void> {
    const roles = (await RoleIntersections.find({ expiration: { $lte: Date.now() } }))
      .map(({ guildId, roleId }) => this.container.client.guilds.resolve(guildId)?.roles.resolve(roleId))
      .filter(filterNullAndUndefined);

    if (roles.length > 0) {
      this.container.logger.debug(`[Intersection Roles] Removed ${roles.length} role ("${roles.map(r => r.name).join('", "')}") as it was mentioned and has expired.`);
      for (const role of roles)
        await role.delete();
    }
  }
}
