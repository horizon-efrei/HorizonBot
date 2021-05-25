import { model, Schema } from 'mongoose';
import type { SavedMessagesDocument, SavedMessagesModel } from '@/types/database';
import { ConfigEntries } from '@/types/database';

const SavedMessagesSchema = new Schema<SavedMessagesDocument, SavedMessagesModel>({
  name: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  guild: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});


export default model<SavedMessagesDocument, SavedMessagesModel>('SavedMessages', SavedMessagesSchema);
