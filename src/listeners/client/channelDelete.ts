import { Listener } from '@sapphire/framework';
import type { DMChannel, GuildChannel } from 'discord.js';
import Configuration from '@/models/configuration';
import ReactionRole from '@/models/reactionRole';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getContentForChannel } from '@/structures/logs/logChannelHelpers';
import { DiscordLogType } from '@/types/database';

export default class ChannelDeleteListener extends Listener {
  public async run(channel: DMChannel | GuildChannel): Promise<void> {
    if (channel.isDMBased())
      return;

    await DiscordLogManager.logAction({
      type: DiscordLogType.ChannelRemove,
      context: channel.id,
      content: getContentForChannel(channel),
      guildId: channel.guild.id,
      severity: 1,
    });

    const affectedReactionRoles = await ReactionRole.find({ channelId: channel.id });
    if (affectedReactionRoles.length > 0) {
      await ReactionRole.deleteMany({ channelId: channel.id });
      const messageIds = affectedReactionRoles.map(rr => rr.messageId);
      this.container.client.reactionRolesIds.deleteAll(...messageIds);
      this.container.logger.debug(`[Reaction Roles] Removed ${affectedReactionRoles.length} reaction-role(s) because the channel ${channel.id} (#${channel.name}) was deleted. Affected reaction-roles: ${affectedReactionRoles.map(rr => rr.getMessageLink()).join(', ')}`);
    }

    const affectedConfigurations = await Configuration.find({ value: channel.id });
    if (affectedConfigurations.length > 0) {
      const names = affectedConfigurations.map(conf => conf.name);
      for (const entry of names)
        await this.container.client.configManager.remove(entry, channel.guild);
      this.container.logger.debug(`[Configuration] Removed configuration entries ${names.join(', ')} because the channel ${channel.id} (#${channel.name}) was deleted.`);
    }
  }
}
