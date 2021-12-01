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
    type: Number,
    required: true,
  },
}, { timestamps: true });

export default model<RoleIntersectionDocument, RoleIntersectionModel>('RoleIntersection', RoleIntersectionSchema);
