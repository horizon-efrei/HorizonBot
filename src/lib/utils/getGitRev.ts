import { promises as fs } from 'node:fs';
import path from 'node:path';

let cachedCommit = '';

/**
 * Get the current git commit hash.
 * @returns The current git commit
 */
export default async function getGitRev(): Promise<string> {
  if (cachedCommit)
    return cachedCommit;

  const headContent = await fs.readFile(path.join(process.cwd(), '.git', 'HEAD'));
  let rev = headContent.toString();
  if (rev.includes(':')) {
    const branchContent = await fs.readFile(path.join(process.cwd(), '.git', rev.slice(5).trim()));
    rev = branchContent.toString();
  }

  cachedCommit = rev;
  return rev;
}
