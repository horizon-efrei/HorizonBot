import { LogLevel, SapphireClient } from '@sapphire/framework';
import { filterNullAndUndefined } from '@sapphire/utilities';
import axios from 'axios';
import {
  Collection,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} from 'discord.js';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import LogStatuses from '@/models/logStatuses';
import ReactionRole from '@/models/reactionRole';
import Reminders from '@/models/reminders';
import ConfigurationManager from '@/structures/ConfigurationManager';
import TaskStore from '@/structures/tasks/TaskStore';
import type { LogStatusesBase, ReminderDocument } from '@/types/database';
import { DiscordLogType, EclassStatus, LogStatuses as LogStatusesEnum } from '@/types/database';
import { nullop } from '@/utils';

export default class HorizonClient extends SapphireClient {
  configManager: ConfigurationManager;
  remainingCompilerApiCredits = 0;

  reactionRolesIds = new Set<string>();
  eclassRolesIds = new Set<string>();
  currentlyRunningEclassIds = new Set<string>();
  roleIntersections = new Set<string>();
  reminders = new Map<string, ReminderDocument>();
  logStatuses = new Collection<string, Collection<DiscordLogType, LogStatusesEnum>>();

  constructor() {
    super({
      logger: {
        level: LogLevel.Debug,
      },
      loadDefaultErrorListeners: true,
      intents: [
        GatewayIntentBits.DirectMessageReactions, // Access to MessageReactionAdd/Remove events in DMs.
        GatewayIntentBits.DirectMessages, // Access to Direct Messages.
        GatewayIntentBits.GuildEmojisAndStickers, // Access to EmojiDelete events.
        GatewayIntentBits.GuildInvites, // Access to InviteCreate events.
        GatewayIntentBits.GuildMembers, // Access to GuildMemberAdd/Update/Remove events.
        GatewayIntentBits.GuildMessageReactions, // Access to MessageReactionAdd/Remove events.
        GatewayIntentBits.GuildMessages, // Access to MessageCreate/Update/Delete events.
        GatewayIntentBits.GuildPresences, // Access to member's presence for /userinfo.
        GatewayIntentBits.Guilds, // Access to Guilds, Channels, Threads, Roles events.
        GatewayIntentBits.GuildVoiceStates, // Access to VoiceStateUpdate events.
        GatewayIntentBits.MessageContent, // Access to message.content.
      ],
      partials: [Partials.Channel],
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
    const requiredChannelPermissions = new PermissionsBitField([
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.AttachFiles,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.CreatePublicThreads,
      PermissionsBitField.Flags.ViewChannel,
    ]);
    const requiredGuildPermissions = new PermissionsBitField([
      ...requiredChannelPermissions,
      PermissionsBitField.Flags.ManageGuild,
      PermissionsBitField.Flags.ManageRoles,
    ]);

    // Traverse each guild we are in
    for (const guild of this.guilds.cache.values()) {
      // Check guild-level permissions
      const guildMissingPerms = guild.members.me?.permissions.missing(requiredGuildPermissions);
      if (guildMissingPerms && guildMissingPerms.length > 0)
        this.logger.warn(`[Main] The bot is missing Guild-Level permissions in guild "${guild.name}". Its cumulated roles' permissions does not contain: ${guildMissingPerms.join(', ')}.`);

      // Check channel-level permissions
      for (const channel of guild.channels.cache.values()) {
        const channelMissingPerms = channel.permissionsFor(guild.members.me!)?.missing(requiredChannelPermissions);
        if (channelMissingPerms && channelMissingPerms.length > 0)
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
        .filter(filterNullAndUndefined));
    }
  }

  public async loadEclassRoles(): Promise<void> {
    this.eclassRolesIds.clear();
    const eclassRoles = await Eclass.find().catch(nullop);
    if (eclassRoles)
      this.eclassRolesIds.addAll(...eclassRoles.map(document => document.announcementMessageId));
  }

  public async loadCurrentlyRunningEclassIds(): Promise<void> {
    this.currentlyRunningEclassIds.clear();
    const eclasses = await Eclass.find({ status: EclassStatus.InProgress }).catch(nullop);
    if (eclasses)
      this.currentlyRunningEclassIds.addAll(...eclasses.map(document => document.classId));
  }

  public async loadReminders(): Promise<void> {
    this.reminders.clear();
    const reminders = await Reminders.find().catch(nullop);
    for (const reminder of reminders ?? [])
      this.reminders.set(reminder.reminderId, reminder);
  }

  public async syncLogStatuses(): Promise<void> {
    const logs = await LogStatuses.find();
    const docs: LogStatusesBase[] = [];

    for (const guildId of this.guilds.cache.keys()) {
      this.logStatuses.set(guildId, new Collection());

      for (const type of Object.values(DiscordLogType)) {
        const currentSetting = logs.find(log => log.guildId === guildId && log.type === type);

        this.logStatuses.get(guildId)!.set(type, currentSetting?.status ?? LogStatusesEnum.Discord);
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
