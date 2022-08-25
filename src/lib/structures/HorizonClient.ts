import { LogLevel, SapphireClient } from '@sapphire/framework';
import axios from 'axios';
import { Collection, Intents, Permissions } from 'discord.js';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import LogStatuses from '@/models/logStatuses';
import ReactionRole from '@/models/reactionRole';
import Reminders from '@/models/reminders';
import ConfigurationManager from '@/structures/ConfigurationManager';
import TaskStore from '@/structures/tasks/TaskStore';
import type { LogStatusesBase, ReminderDocument } from '@/types/database';
import { DiscordLogType, LogStatuses as LogStatusesEnum } from '@/types/database';
import { nullop } from '@/utils';

export default class HorizonClient extends SapphireClient {
  configManager: ConfigurationManager;
  remainingCompilerApiCredits = 0;

  reactionRolesIds = new Set<string>();
  eclassRolesIds = new Set<string>();
  roleIntersections = new Set<string>();
  reminders = new Set<ReminderDocument>();
  logStatuses = new Collection<string, Collection<DiscordLogType, LogStatusesEnum>>();

  constructor() {
    super({
      logger: {
        level: LogLevel.Debug,
      },
      loadDefaultErrorListeners: true,
      intents: [
        Intents.FLAGS.GUILD_PRESENCES, // Access to member's presence for /userinfo.
        Intents.FLAGS.DIRECT_MESSAGES, // Access to Direct Messages.
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, // Access to MessageReactionAdd/Remove events in DMs.
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, // Access to EmojiDelete events.
        Intents.FLAGS.GUILD_INVITES, // Access to InviteCreate events.
        Intents.FLAGS.GUILD_MEMBERS, // Access to GuildMemberAdd/Update/Remove events.
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, // Access to MessageReactionAdd/Remove events.
        Intents.FLAGS.GUILD_MESSAGES, // Access to MessageCreate/Update/Delete events.
        Intents.FLAGS.GUILD_VOICE_STATES, // Access to VoiceStateUpdate events.
        Intents.FLAGS.GUILDS, // Access to Guilds, Channels, Threads, Roles events.
      ],
      partials: ['CHANNEL'],
    });

    this.stores.register(new TaskStore());

    void this._loadCompilerApiCredits();
    void this.loadReactionRoles();
    void this.loadEclassRoles();
    void this.loadReminders();

    this.configManager = new ConfigurationManager();

    this.logger.info('[Main] Client initialization finished!');
  }

  public checkValidity(): void {
    // Check tokens.
    if (!process.env.SENTRY_TOKEN)
      this.logger.warn('[Main] Disabling Sentry as the DSN was not set in the environment variables (SENTRY_TOKEN).');

    // Check permissions
    const requiredChannelPermissions = new Permissions([
      'ADD_REACTIONS',
      'ATTACH_FILES',
      'MANAGE_MESSAGES',
      'READ_MESSAGE_HISTORY',
      'SEND_MESSAGES',
      'USE_PUBLIC_THREADS',
      'VIEW_CHANNEL',
    ]);
    const requiredGuildPermissions = new Permissions([
      ...requiredChannelPermissions,
      'MANAGE_GUILD',
      'MANAGE_ROLES',
    ]);

    // Traverse each guild we are in
    for (const guild of this.guilds.cache.values()) {
      // Check guild-level permissions
      const guildMissingPerms = guild.me?.permissions.missing(requiredGuildPermissions);
      if (guildMissingPerms.length > 0)
        this.logger.warn(`[Main] The bot is missing Guild-Level permissions in guild "${guild.name}". Its cumulated roles' permissions does not contain: ${guildMissingPerms.join(', ')}.`);

      // Check channel-level permissions
      for (const channel of guild.channels.cache.values()) {
        const channelMissingPerms = channel.permissionsFor(guild.me).missing(requiredChannelPermissions);
        if (channelMissingPerms.length > 0)
          this.logger.warn(`[Main] The bot is missing permission(s) ${channelMissingPerms.join(', ')} in channel "#${channel.name}" in guild "${guild.name}".`);
      }
    }
  }

  public async loadReactionRoles(): Promise<void> {
    this.reactionRolesIds.clear();
    const reactionRoles = await ReactionRole.find().catch(nullop);
    if (reactionRoles) {
      this.reactionRolesIds.addAll(...reactionRoles
        .map(document => document?.messageId)
        .filter(Boolean));
    }
  }

  public async loadEclassRoles(): Promise<void> {
    this.eclassRolesIds.clear();
    const eclassRoles = await Eclass.find().catch(nullop);
    if (eclassRoles) {
      this.eclassRolesIds.addAll(...eclassRoles
        .map(document => document?.announcementMessage)
        .filter(Boolean));
    }
  }

  public async loadReminders(): Promise<void> {
    this.reminders.clear();
    const reminders = await Reminders.find().catch(nullop);
    if (reminders)
      this.reminders.addAll(...reminders);
  }

  public async syncLogStatuses(): Promise<void> {
    const logs = await LogStatuses.find();
    const docs: LogStatusesBase[] = [];

    for (const guildId of this.guilds.cache.keys()) {
      this.logStatuses.set(guildId, new Collection());

      for (const logType of Object.values(DiscordLogType).filter(Number.isInteger)) {
        const type = logType as DiscordLogType;
        const currentSetting = logs.find(log => log.guildId === guildId && log.type === logType);

        this.logStatuses.get(guildId).set(type, currentSetting?.status ?? LogStatusesEnum.Discord);
        if (!currentSetting)
          docs.push({ guildId, type, status: LogStatusesEnum.Discord });
      }
    }
    await LogStatuses.insertMany(docs);
  }

  private async _loadCompilerApiCredits(): Promise<void> {
    const response = await axios.post<{ used: number }>(settings.apis.compilerCredits, {
      clientId: process.env.COMPILERAPI_ID,
      clientSecret: process.env.COMPILERAPI_SECRET,
    }).catch(_ => ({ status: 521, data: {} }));

    if (response.status >= 300 || !('used' in response.data) || typeof response.data?.used === 'undefined') {
      this.logger.error('[Compiler API] Unable to load remaining CompilerApi credits, command will not be available.');
      return;
    }

    this.remainingCompilerApiCredits = 200 - response.data.used;
    this.logger.info(`[Compiler API] ${200 - this.remainingCompilerApiCredits}/200 credits used (${this.remainingCompilerApiCredits} remaining).`);
  }
}
