import type {
  Collection,
  GuildAuditLogs,
  GuildAuditLogsEntry,
  Snowflake,
  User,
} from 'discord.js';

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
