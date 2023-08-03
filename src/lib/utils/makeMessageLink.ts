/**
 * Returns a Discord message link from the guild ID, channel ID, and message ID.
 */
export function makeMessageLink(guildId: string, channelId: string, messageId: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
