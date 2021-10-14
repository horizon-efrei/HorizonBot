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
  uniqueRole: {
    type: Boolean,
    default: false,
  },
  roleCondition: {
    type: String,
    default: null,
  },
}, { timestamps: true });

ReactionRoleSchema.methods.getMessageUrl = function (this: ReactionRoleDocument): string {
  return `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.messageId}`;
};

export default model<ReactionRoleDocument, ReactionRoleModel>('ReactionRole', ReactionRoleSchema);
