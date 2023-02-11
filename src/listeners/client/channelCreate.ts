import { Listener } from '@sapphire/framework';
import type { GuildChannel } from 'discord.js';
import { AuditLogEvent } from 'discord.js';
import * as DiscordLogManager from '@/structures/logs/DiscordLogManager';
import { getChannelSnapshot } from '@/structures/logs/snapshotHelpers';
import { DiscordLogType } from '@/types/database';
import { nullop } from '@/utils';

export default class ChannelCreateListener extends Listener {
  public async run(channel: GuildChannel): Promise<void> {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate }).catch(nullop);
    const lastChannelCreate = auditLogs?.entries
      .filter(entry => entry.target?.id === channel.id && entry.createdTimestamp > Date.now() - 2000)
      .first();

    await DiscordLogManager.logAction({
      type: DiscordLogType.ChannelCreate,
      context: {
        channelId: channel.id,
        executorId: lastChannelCreate?.executor?.id,
      },
      content: getChannelSnapshot(channel),
      guildId: channel.guild.id,
      severity: 1,
    });
  }
}
