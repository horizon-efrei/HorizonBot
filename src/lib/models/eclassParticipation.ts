import crypto from 'node:crypto';
import { model, Schema } from 'mongoose';
import type { EclassParticipationDocument, EclassParticipationModel } from '@/types/database';

function generateHashFactory(): (id: string) => string {
  const cache = new Map<string, string>();
  return (id: string): string => {
    if (cache.has(id))
      return cache.get(id)!;

    const hash = crypto.createHash('sha1');
    const data = hash.update(id, 'utf8');
    const result = data.digest('hex');
    cache.set(id, result);
    return result;
  };
}

const EclassParticipationSchema = new Schema<EclassParticipationDocument, EclassParticipationModel, null>({
  anonUserId: {
    type: String,
    required: true,
    index: true,
  },
  eclass: {
    type: Schema.Types.ObjectId,
    index: true,
    ref: 'Eclass',
    required: true,
    autopopulate: true,
  },
  joinedAt: {
    type: Date,
    required: true,
  },
  leftAt: {
    type: Date,
    default: null,
    required: false,
  },
  isSubscribed: {
    type: Boolean,
    required: true,
  },
}, { timestamps: true });

EclassParticipationSchema.statics.generateHash = generateHashFactory();

export const EclassParticipation = model<EclassParticipationDocument, EclassParticipationModel>('EclassParticipation', EclassParticipationSchema);
