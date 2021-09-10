/** Gets the first part and the rest part of a string, with a defined delimiter.
 * @param str The text to split
 * @param delimiter The delimiter to split the text at
 * @returns A tuple with the first string, and the rest of the string
 */
export default function firstAndRest(str: string, delimiter: string): [first: string, rest: string] {
  const parts = str.split(delimiter);
  const first = parts.shift();
  const rest = parts.filter(Boolean).join(delimiter);
  return [first, rest.trim()];
}
