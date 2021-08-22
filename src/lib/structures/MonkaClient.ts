import { LogLevel, SapphireClient } from '@sapphire/framework';
import axios from 'axios';
import { oneLine } from 'common-tags';
import type { GuildChannel, PermissionString, TextChannel } from 'discord.js';
import { Intents } from 'discord.js';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import ReactionRole from '@/models/reactionRole';
import Tags from '@/models/tags';
import ConfigurationManager from '@/structures/ConfigurationManager';
import type FlaggedMessage from '@/structures/FlaggedMessage';
import TaskStore from '@/structures/TaskStore';
import type { TagDocument } from '@/types/database';
import { nullop } from '@/utils';

export default class MonkaClient extends SapphireClient {
  configManager: ConfigurationManager;
  remainingCompilerApiCredits = 0;
  reactionRolesIds: Set<string>;
  eclassRolesIds: Set<string>;
  waitingFlaggedMessages: FlaggedMessage[];
  intersectionRoles: Set<string>;
  tags: Set<TagDocument>;

  constructor() {
    super({
      caseInsensitiveCommands: true,
      caseInsensitivePrefixes: true,
      defaultPrefix: settings.prefix,
      logger: {
        level: LogLevel.Trace,
      },
      loadDefaultErrorEvents: true,
      presence: { status: 'online', activities: [{ type: 'LISTENING', name: `${settings.prefix}help` }] },
      intents: [
        Intents.FLAGS.GUILDS, // Get access to channels, create some, pin messages etc.
        Intents.FLAGS.GUILD_MEMBERS, // Access to GuildMemberAdd/GuildMemberRemove events.
        Intents.FLAGS.GUILD_MESSAGES, // Access to Message, MessageDelete and MessageUpdate events.
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, // Access to MessageReactionAdd events.
        Intents.FLAGS.GUILD_VOICE_STATES, // Access to VoiceStateUpdate events.
      ],
    });

    this.stores.register(new TaskStore());

    this.waitingFlaggedMessages = [];
    this.intersectionRoles = new Set();
    void this._loadCompilerApiCredits();
    void this.loadReactionRoles();
    void this.loadEclassRoles();
    void this.loadTags();

    this.configManager = new ConfigurationManager(this);

    this.logger.info('[Main] Client initialization finished!');
  }

  public checkValidity(): void {
    // Check tokens.
    if (!process.env.SENTRY_TOKEN)
      this.logger.warn('[Main] Disabling Sentry as the DSN was not set in the environment variables (SENTRY_TOKEN).');

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
    for (const guild of this.guilds.cache.values()) {
      // Check guild-level permissions
      if (!guild.me?.permissions.has(permissions)) {
        this.logger.warn(oneLine`
          [Main]
          MonkaBot is missing Guild-Level permissions in guild "${guild.name}". Its cumulated roles' permissions does
          not contain one of the following: ${permissions.join(', ')}.
        `);
      }

      // Grab all channels
      const guildChannels = [
        ...guild.channels.cache
          .filter((chan: GuildChannel): chan is TextChannel => chan.isText())
          .values(),
      ];

      for (const channel of guildChannels) {
        // Check channel-level permissions
        const channelPermissions = channel.permissionsFor(guild.me)?.toArray();
        if (channelPermissions && !permissions.every(perm => channelPermissions.includes(perm))) {
          this.logger.warn(oneLine`
            [Main]
            MonkaBot is missing permission(s) ${permissions.filter(perm => !channelPermissions.includes(perm)).join(', ')}
            in channel "#${channel.name}" in guild "${guild.name}"
          `);
          }
      }
    }
  }

  public async loadReactionRoles(): Promise<void> {
    this.reactionRolesIds = new Set();
    const reactionRoles = await ReactionRole.find().catch(nullop);
    if (reactionRoles) {
      this.reactionRolesIds.addAll(...reactionRoles
        .map(document => document?.messageId)
        .filter(Boolean));
    }
  }

  public async loadEclassRoles(): Promise<void> {
    this.eclassRolesIds = new Set();
    const eclassRoles = await Eclass.find().catch(nullop);
    if (eclassRoles) {
      this.eclassRolesIds.addAll(...eclassRoles
        .map(document => document?.announcementMessage)
        .filter(Boolean));
    }
  }

  public async loadTags(): Promise<void> {
    this.tags = new Set();
    const tags = await Tags.find().catch(nullop);
    if (tags)
      this.tags.addAll(...tags);
  }

  private async _loadCompilerApiCredits(): Promise<void> {
    const response = await axios.post(settings.apis.compilerCredits, {
      clientId: process.env.COMPILERAPI_ID,
      clientSecret: process.env.COMPILERAPI_SECRET,
    }).catch(_ => ({ status: 521, data: {} }));

    if (response.status >= 300 || typeof response.data?.used === 'undefined') {
      this.logger.error('[Compiler API] Unable to load remaining CompilerApi credits, command will not be available.');
      return;
    }

    this.remainingCompilerApiCredits = 200 - response.data.used;
    this.logger.info(`[Compiler API] ${200 - this.remainingCompilerApiCredits}/200 credits used (${this.remainingCompilerApiCredits} remaining).`);
  }
}
