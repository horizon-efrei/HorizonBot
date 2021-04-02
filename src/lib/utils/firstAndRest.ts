/**
 * Convert a number to a file size in octets.
 * @param {string} str - The text to split
 * @param {string} delimiter - The delimiter to split the text at
 * @returns [first: string, rest: string]
 */
export default function firstAndRest(str: string, delimiter: string): [first: string, rest: string] {
  const parts = str.split(delimiter);
  const first = parts.shift();
  const rest = parts.filter(Boolean).join(delimiter);
  return [first, rest.trim()];
}
