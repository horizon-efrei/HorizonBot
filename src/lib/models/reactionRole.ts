import { model, Schema } from 'mongoose';
import type { ReactionRoleDocument, ReactionRoleModel } from '@/types/database';
import { makeMessageLink } from '@/utils';

const ReactionRoleSchema = new Schema<ReactionRoleDocument, ReactionRoleModel, null>({
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
  uniqueRole: {
    type: Boolean,
    default: false,
  },
  roleCondition: {
    type: String,
    default: null,
  },
}, { timestamps: true });

ReactionRoleSchema.methods.getMessageLink = function (this: ReactionRoleDocument): string {
  return makeMessageLink(this.guildId, this.channelId, this.messageId);
};

export default model<ReactionRoleDocument, ReactionRoleModel>('ReactionRole', ReactionRoleSchema);
