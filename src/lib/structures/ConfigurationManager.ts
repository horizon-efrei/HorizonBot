import Configuration from '@/models/configuration';
import type MonkaClient from '@/structures/MonkaClient';
import type { GuildTextBasedChannel } from '@/types';
import { ConfigEntries } from '@/types/database';
import type { ConfigurationDocument } from '@/types/database';
import { nullop } from '@/utils';

export default class ConfigurationManager {
  channels: Record<ConfigEntries, GuildTextBasedChannel>;

  constructor(public readonly client: MonkaClient) {}

  public async set(channel: ConfigEntries, value: GuildTextBasedChannel): Promise<void> {
    await Configuration.findOneAndUpdate(
      { name: ConfigEntries.ModeratorFeedback },
      { value: value.id },
      { upsert: true },
    );
    this.channels[channel] = value;
  }

  public async get(channel: ConfigEntries): Promise<GuildTextBasedChannel> {
    if (this.channels[channel])
      return this.channels[channel];
    const result = await Configuration.findOne({ name: ConfigEntries.ModeratorFeedback }).catch(nullop);
    if (result?.value) {
      const resolvedChannel = this.client.channels.resolve(result.value);
      if (resolvedChannel.isText() && resolvedChannel.type !== 'dm') {
        this.channels[channel] = resolvedChannel;
        return resolvedChannel;
      }
    }
  }

  public async loadAll(): Promise<void> {
    this.channels = {
      [ConfigEntries.ModeratorFeedback]: null,
    };
    const configuredChannels: ConfigurationDocument[] = await Configuration.find().catch(nullop);
    if (!configuredChannels)
      return;

    for (const channel of configuredChannels)
      this.channels[channel.name] = this.client.channels.resolve(channel.value) as GuildTextBasedChannel;
  }
}
