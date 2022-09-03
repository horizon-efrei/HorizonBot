import { container } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { Collection, GuildChannel, Role } from 'discord.js';
import Configuration from '@/models/configuration';
import type { GuildTextBasedChannel } from '@/types';
import type { ConfigEntries, ConfigEntriesChannels, ConfigEntryHolds } from '@/types/database';
import { nullop } from '@/utils';

export default class ConfigurationManager {
  private readonly _entries = new Collection<
    string,
    { guild: string; name: ConfigEntries; value: ConfigEntryHolds }
  >();

  public async set(name: ConfigEntries, value: ConfigEntryHolds): Promise<void> {
    const guild = value.guild.id;
    await Configuration.findOneAndUpdate(
      { guild, name },
      { guild, value: value.id },
      { upsert: true },
    );

    this._entries.set(this._getKey(name, value.guild.id), { guild, name, value });
  }

  public async remove(name: ConfigEntries, guild: Guild): Promise<void> {
    await Configuration.findOneAndDelete({ guild: guild.id, name });
    this._entries.delete(this._getKey(name, guild.id));
  }

  public getFromCache<
    T extends ConfigEntries,
    Return = T extends ConfigEntriesChannels ? GuildTextBasedChannel : Role,
  >(name: T, guildId: string): Return | undefined {
    const key = this._getKey(name, guildId);
    if (this._entries.has(key))
      return this._entries.get(key)!.value as unknown as Return;
  }

  public async get<
    T extends ConfigEntries,
    Return = T extends ConfigEntriesChannels ? GuildTextBasedChannel : Role,
  >(name: T, guildId: string): Promise<Return | undefined> {
    const key = this._getKey(name, guildId);
    if (this._entries.has(key))
      return this._entries.get(key)!.value as unknown as Return;

    const result = await Configuration.findOne({ guild: guildId, name }).catch(nullop);
    if (result?.value) {
      const resolved = this._resolve(result.value, guildId);
      if (resolved) {
        this._entries.set(key, { guild: guildId, name, value: resolved });
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
        this._entries.set(
          this._getKey(document.name, document.guildId),
          { guild: document.guildId, name: document.name, value },
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
    if (resolved instanceof Role || (resolved instanceof GuildChannel && resolved.isText()))
      return resolved;
  }
}
