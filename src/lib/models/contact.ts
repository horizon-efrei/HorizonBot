import { model, Schema } from 'mongoose';
import type { ContactDocument, ContactModel } from '@/types/database';

const ContactSchema = new Schema<ContactDocument, ContactModel, null>({
  team: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
}, { timestamps: true });

export default model<ContactDocument, ContactModel>('Contact', ContactSchema);
