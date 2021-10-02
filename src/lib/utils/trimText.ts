/**
 * Trims a long text at a certain amount of characters, and append "..." at the end if it was cutted-out
 * @param text The text to trim
 * @param n The amount of characters to show, defaults to 500
 * @returns The trimmed text
 */
export default function trimText(text: string, n = 500): string {
  return text.length > n ? `${text.slice(0, n)}...` : text;
}
