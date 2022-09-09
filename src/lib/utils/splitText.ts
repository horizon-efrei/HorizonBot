import { MessageLimits } from '@sapphire/discord-utilities';

/**
 * Split a long text into an array of strings of `n` characters maximum, and between each line.
 * @param text The text to split
 * @param n The size of each array. Defaults to 2000 (@sapphire/discord-utilities#MessageLimits.MaximumLength)
 * @returns The split text
 */
export default function splitText(text: string, n = MessageLimits.MaximumLength): string[] {
  const blocks: string[] = [];
  const lines = text.split(/\n/g);
  let index = 0;

  for (const line of lines) {
    if (line.length >= n - 2)
      blocks[index] = `${line.slice(0, n)}\n`;

    if ((blocks[index] || '').length + line.length >= n - 2)
      index++;
    if (!blocks[index])
      blocks[index] = '';

    blocks[index] += `${line.slice(0, n - 1)}\n`;
  }

  return blocks;
}
