import { container } from '@sapphire/pieces';
import { model, Schema } from 'mongoose';
import type { TagDocument, TagModel } from '@/types/database';

const TagSchema = new Schema<TagDocument, TagModel>({
  name: {
    type: String,
    required: true,
    index: true,
  },
  aliases: [{
    type: String,
    default: [],
  }],
  content: {
    type: String,
    required: true,
  },
  uses: {
    type: Number,
    default: 0,
  },
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

TagSchema.post('save', async () => {
  await container.client.loadTags();
});
TagSchema.post('remove', async () => {
  await container.client.loadTags();
});

export default model<TagDocument, TagModel>('Tags', TagSchema);
