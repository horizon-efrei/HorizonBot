/**
 * Returns the URL of an image corresponding to the given emoji
 * @param emoji The emoji to get the image of
 * @returns The URL of the image
 */
export function getEmojiImage(emoji: string): string {
  const unifiedId = [...emoji].map(e => e.codePointAt(0)!.toString(16)).join('-');
  return `https://twemoji.maxcdn.com/v/latest/72x72/${unifiedId.toLowerCase()}.png`;
}
