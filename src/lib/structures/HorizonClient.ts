import { LogLevel, SapphireClient } from '@sapphire/framework';
import { filterNullAndUndefined } from '@sapphire/utilities';
import axios from 'axios';
import {
  Collection,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} from 'discord.js';
import { settings } from '@/config/settings';
import { Eclass } from '@/models/eclass';
import { ReactionRole } from '@/models/reactionRole';
import { Reminder } from '@/models/reminders';
import { ConfigurationManager } from '@/structures/ConfigurationManager';
import { TaskStore } from '@/structures/tasks/TaskStore';
import type { DiscordLogType, LogStatuses as LogStatusesEnum, ReminderDocument } from '@/types/database';
import { EclassStatus } from '@/types/database';
import { nullop } from '@/utils';
import { SubjectsManager } from './SubjectsManager';

export class HorizonClient extends SapphireClient {
  configManager: ConfigurationManager;
  subjectsManager: SubjectsManager;
  remainingCompilerApiCredits = 0;

  reactionRolesIds = new Set<string>();
  eclassRolesIds = new Set<string>();
  currentlyRunningEclassIds = new Set<string>();
  roleIntersections = new Set<string>();
  reminders = new Map<string, ReminderDocument>();
  logStatuses = new Collection<string, Collection<DiscordLogType, LogStatusesEnum>>();
  // eslint-disable-next-line unicorn/consistent-function-scoping
  loading = new Promise<void>((resolve) => {
    this._finishedLoading = resolve;
  });

  private _finishedLoading: (() => void) | undefined;

  constructor() {
    super({
      logger: {
        level: LogLevel.Info,
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
    this.configManager = new ConfigurationManager();

    void this._startCaches();
  }

  public checkValidity(): void {
    // Check tokens.
    if (!process.env.SENTRY_TOKEN)
      this.logger.warn('[Main] Disabling Sentry as the DSN was not set in the environment variables (SENTRY_TOKEN).');
    if (!process.env.GOOGLE_SHEET_SVC_EMAIL || !process.env.GOOGLE_SHEET_SVC_PRIVATE_KEY)
      throw new Error('Missing Google Sheet service account environment variables');
    if (!process.env.GOOGLE_SHEET_ID)
      throw new Error('Missing Google Sheet ID environment variable');

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

  public async cacheReminders(): Promise<void> {
    this.reminders.clear();
    const reminders = await Reminder.find().catch(nullop);
    for (const reminder of reminders ?? [])
      this.reminders.set(reminder.reminderId, reminder);
  }

  private async _startCaches(): Promise<void> {
    await this._loadCompilerApiCredits();

    this.logger.info('[Offline Cache] Caching subjects...');
    await this._cacheSubjects();

    this.logger.info('[Offline Cache] Caching reaction roles...');
    await this._cacheReactionRoles();

    this.logger.info('[Offline Cache] Caching eclass roles...');
    await this._cacheEclassRoles();

    this.logger.info('[Offline Cache] Caching currently running eclasses...');
    await this._cacheCurrentlyRunningEclassIds();

    this.logger.info('[Offline Cache] Caching reminders...');
    await this.cacheReminders();

    this._finishedLoading?.();
    this.logger.info('[Offline Cache] All caching done!');
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

  private async _cacheSubjects(): Promise<void> {
    this.subjectsManager = new SubjectsManager(process.env.GOOGLE_SHEET_ID!);
    await this.subjectsManager.refresh();
  }

  private async _cacheReactionRoles(): Promise<void> {
    this.reactionRolesIds.clear();
    const reactionRoles = await ReactionRole.find().catch(nullop);
    if (reactionRoles) {
      this.reactionRolesIds.addAll(...reactionRoles
        .map(document => document?.messageId)
        .filter(filterNullAndUndefined));
    }
  }

  private async _cacheEclassRoles(): Promise<void> {
    this.eclassRolesIds.clear();
    const eclassRoles = await Eclass.find().catch(nullop);
    if (eclassRoles)
      this.eclassRolesIds.addAll(...eclassRoles.map(document => document.announcementMessageId));
  }

  private async _cacheCurrentlyRunningEclassIds(): Promise<void> {
    this.currentlyRunningEclassIds.clear();
    const eclasses = await Eclass.find({ status: EclassStatus.InProgress }).catch(nullop);
    if (eclasses)
      this.currentlyRunningEclassIds.addAll(...eclasses.map(document => document.classId));
  }
}
