import { model, Schema } from 'mongoose';
import type { ConfigurationDocument, ConfigurationModel } from '@/types/database';
import { ConfigEntries } from '@/types/database';

const ConfigurationSchema = new Schema<ConfigurationDocument, ConfigurationModel>({
  name: {
    type: String, 
    required: true,
    enum: ConfigEntries,
    default: ConfigEntries.ModeratorFeedback,
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
