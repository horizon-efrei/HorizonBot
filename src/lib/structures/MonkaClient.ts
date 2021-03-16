import { LogLevel, SapphireClient } from '@sapphire/framework';
import { oneLine } from 'common-tags';
import type { GuildChannel, PermissionString, TextChannel } from 'discord.js';
import { Intents } from 'discord.js';
import settings from '@/config/settings';
import ConfigurationManager from './ConfigurationManager';

export default class MonkaClient extends SapphireClient {
  configurationManager: ConfigurationManager;

  constructor() {
    super({
      caseInsensitiveCommands: true,
      caseInsensitivePrefixes: true,
      defaultPrefix: settings.prefix,
      logger: {
        level: LogLevel.Trace,
      },
      loadDefaultErrorEvents: true,
      presence: { status: 'online', activity: { type: 'LISTENING', name: `${settings.prefix}help` } },
      ws: {
        intents: [
          Intents.FLAGS.GUILDS, // Get access to channels, create some, pin messages etc.
          Intents.FLAGS.GUILD_MEMBERS, // Access to GuildMemberAdd/GuildMemberRemove events.
          Intents.FLAGS.GUILD_MESSAGES, // Access to Message, MessageDelete and MessageUpdate events.
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS, // Access to MessageReactionAdd events.
        ],
      },
    });

    this.configurationManager = new ConfigurationManager(this);
    void this.configurationManager.loadAll();

    this.logger.info('Client initialization finished!');
  }

  public checkValidity(): void {
    // Check tokens.
    if (!process.env.SENTRY_TOKEN)
      this.logger.warn('Disabling Sentry as the DSN was not set in the environment variables (SENTRY_TOKEN).');

    // Check permissions
    const permissions: PermissionString[] = [
      'ADD_REACTIONS',
      'VIEW_CHANNEL',
      'SEND_MESSAGES',
      'MANAGE_MESSAGES',
      'ATTACH_FILES',
      'READ_MESSAGE_HISTORY',
    ];
    // Traverse each guild we are in
    for (const guild of this.guilds.cache.array()) {
      // Check guild-level permissions
      if (!guild.me?.hasPermission(permissions)) {
        this.logger.warn(oneLine`
          MonkaBot is missing Guild-Level permissions in guild "${guild.name}". Its cumulated roles' permissions does
          not contain one of the following: ${permissions.join(', ')}.
        `);
      }

      // Grab all channels
      const guildChannels = guild.channels.cache
        .filter((chan: GuildChannel): chan is TextChannel => chan.isText())
        .array();

      for (const channel of guildChannels) {
        // Check channel-level permissions
        const channelPermissions = channel.permissionsFor(guild.me)?.toArray();
        if (channelPermissions && !permissions.every(perm => channelPermissions.includes(perm))) {
          this.logger.warn(oneLine`
            MonkaBot is missing permission(s) ${permissions.filter(perm => !channelPermissions.includes(perm)).join(', ')}
            in channel "#${channel.name}" in guild "${guild.name}"
          `);
          }
      }
    }
  }
}
