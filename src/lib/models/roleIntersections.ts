import { model, Schema } from 'mongoose';
import type { RoleIntersectionDocument, RoleIntersectionModel } from '@/types/database';

const RoleIntersectionSchema = new Schema<RoleIntersectionDocument, RoleIntersectionModel, null>({
  roleId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  expiration: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

export const RoleIntersection = model<RoleIntersectionDocument, RoleIntersectionModel>('RoleIntersection', RoleIntersectionSchema);
