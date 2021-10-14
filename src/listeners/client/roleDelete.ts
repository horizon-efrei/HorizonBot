import { Listener } from '@sapphire/framework';
import type { Role } from 'discord.js';
import Configuration from '@/models/configuration';
import type { GuildTextBasedChannel } from '@/types';

export default class RoleDeleteListener extends Listener {
  public async run(role: Role): Promise<void> {
    const affectedConfigurations = await Configuration.find({ value: role.id });
    if (affectedConfigurations.length > 0) {
      const names = affectedConfigurations.map(conf => conf.name);
      for (const entry of names)
        await this.container.client.configManager.remove(entry, role.guild);
      this.container.logger.debug(`[Configuration] Removed configuration entries ${names.join(', ')} because the role ${role.id} (@${role.name}) was deleted.`);
    }
  }
}
