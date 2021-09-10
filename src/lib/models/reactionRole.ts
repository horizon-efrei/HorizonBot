import { model, Schema } from 'mongoose';
import type { ReactionRoleDocument, ReactionRoleModel } from '@/types/database';

const ReactionRoleSchema = new Schema<ReactionRoleDocument, ReactionRoleModel>({
  messageId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  reactionRolePairs: [{
    role: String,
    reaction: String,
  }],
}, { timestamps: true });

export default model<ReactionRoleDocument, ReactionRoleModel>('ReactionRole', ReactionRoleSchema);
