import { model, Schema } from 'mongoose';
import type { FaqDocument, FaqModel } from '@/types/database';

const FaqSchema = new Schema<FaqDocument, FaqModel, null>({
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
  guildId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const Faq = model<FaqDocument, FaqModel>('Faq', FaqSchema);
