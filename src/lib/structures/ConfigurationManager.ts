import { container } from '@sapphire/framework';
import type { Guild, GuildTextBasedChannel } from 'discord.js';
import {
  ChannelType,
  Collection,
  GuildChannel,
  Role,
} from 'discord.js';
import { Configuration } from '@/models/configuration';
import type { ConfigEntries, ConfigEntriesChannels, ConfigEntryHolds } from '@/types/database';
import { nullop } from '@/utils';

export class ConfigurationManager {
  private readonly _cache = new Collection<
    string,
    { guildId: string; name: ConfigEntries; value: ConfigEntryHolds }
  >();

  public async set(name: ConfigEntries, value: ConfigEntryHolds): Promise<void> {
    const guildId = value.guild.id;
    await Configuration.findOneAndUpdate(
      { guildId, name },
      { guildId, value: value.id },
      { upsert: true },
    );

    this._cache.set(this._getKey(name, value.guild.id), { guildId, name, value });
  }

  public async remove(name: ConfigEntries, guild: Guild): Promise<void> {
    await Configuration.findOneAndDelete({ guildId: guild.id, name });
    this._cache.delete(this._getKey(name, guild.id));
  }

  public getFromCache<
    T extends ConfigEntries,
    Return = T extends ConfigEntriesChannels ? GuildTextBasedChannel : Role,
  >(name: T, guildId: string): Return | undefined {
    const key = this._getKey(name, guildId);
    if (this._cache.has(key))
      return this._cache.get(key)!.value as unknown as Return;
  }

  public async get<
    T extends ConfigEntries,
    Return = T extends ConfigEntriesChannels ? GuildTextBasedChannel : Role,
  >(name: T, guildId: string): Promise<Return | undefined> {
    const key = this._getKey(name, guildId);
    if (this._cache.has(key))
      return this._cache.get(key)!.value as unknown as Return;

    const result = await Configuration.findOne({ guildId, name }).catch(nullop);
    if (result?.value) {
      const resolved = this._resolve(result.value, guildId);
      if (resolved) {
        this._cache.set(key, { guildId, name, value: resolved });
        return resolved as unknown as Return;
      }
    }
  }

  public async loadAll(): Promise<void> {
    const documents = await Configuration.find().catch(nullop);
    if (!documents)
      return;

    for (const document of documents) {
      const value = this._resolve(document.value, document.guildId);
      if (value) {
        this._cache.set(
          this._getKey(document.name, document.guildId),
          { guildId: document.guildId, name: document.name, value },
        );
      }
    }
  }

  private _getKey(name: ConfigEntries, guildId: string): `${string}` {
    return `${guildId}-${name}`;
  }

  private _resolve(value: string, guildId: string): ConfigEntryHolds | undefined {
    const guild = container.client.guilds.cache.get(guildId);
    if (!guild)
      return;

    const resolved = guild.channels.resolve(value) ?? guild.roles.resolve(value);
    if (resolved instanceof GuildChannel
      && (resolved.type === ChannelType.GuildAnnouncement
        || resolved.type === ChannelType.GuildText
        || resolved.type === ChannelType.GuildVoice))
      return resolved;

    if (resolved instanceof Role)
      return resolved;
  }
}
