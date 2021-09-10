/**
 * Capitalize the first character of a string.
 * @param string The text to split
 * @returns The capitalized text
 */
export default function capitalize(string: string): string {
  return string[0].toUpperCase() + string.slice(1);
}
