import { model, Schema } from 'mongoose';
import type { TagDocument, TagModel } from '@/types/database';

const TagSchema = new Schema<TagDocument, TagModel, null>({
  name: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  uses: {
    type: Number,
    default: 0,
  },
  isEmbed: {
    type: Boolean,
    default: false,
  },
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const Tag = model<TagDocument, TagModel>('Tags', TagSchema);
