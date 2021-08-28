import { model, Schema } from 'mongoose';
import type { ConfigurationDocument, ConfigurationModel } from '@/types/database';
import { ConfigEntriesChannels, ConfigEntriesRoles } from '@/types/database';

const ConfigurationSchema = new Schema<ConfigurationDocument, ConfigurationModel>({
  name: {
    type: String,
    required: true,
    enum: [Object.values(ConfigEntriesChannels), Object.values(ConfigEntriesRoles)].flat(),
  },
  guild: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

export default model<ConfigurationDocument, ConfigurationModel>('Configuration', ConfigurationSchema);
