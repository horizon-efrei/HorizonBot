import type {
  Collection,
  GuildAuditLogs,
  GuildAuditLogsEntry,
  Snowflake,
  User,
} from 'discord.js';
import type { GuildTextBasedChannel } from '@/types';

/** Represents a MemberRoleUpdate entry in the guild audit logs */
export interface GuildMemberRoleUpdateAuditLogsEntry extends GuildAuditLogsEntry {
  action: 'MEMBER_ROLE_UPDATE';
  target: User;
  targetType: 'USER';
}

/** Represents an audit log where all entries are MemberRoleUpdate entries */
export interface GuildMemberRoleUpdateAuditLogs extends GuildAuditLogs {
  entries: Collection<Snowflake, GuildMemberRoleUpdateAuditLogsEntry>;
}

/** Represents a MemberUpdate entry in the guild audit logs */
export interface GuildMemberUpdateAuditLogsEntry extends GuildAuditLogsEntry {
  action: 'MEMBER_UPDATE';
  target: User;
  targetType: 'USER';
}

/** Represents an audit log where all entries are MemberUpdate entries */
export interface GuildMemberUpdateAuditLogs extends GuildAuditLogs {
  entries: Collection<Snowflake, GuildMemberUpdateAuditLogsEntry>;
}

/** Represents a MessageDelete entry in the guild audit logs */
export interface MessageDeleteAuditLogsEntry extends GuildAuditLogsEntry {
  action: 'MESSAGE_DELETE';
  extra: {
    channel: GuildTextBasedChannel | string;
    count: number;
  };
  target: User;
  targetType: 'MESSAGE';
}

/** Represents an audit log where all entries are MessageDelete entries */
export interface MessageDeleteAuditLogs extends GuildAuditLogs {
  entries: Collection<Snowflake, MessageDeleteAuditLogsEntry>;
}
