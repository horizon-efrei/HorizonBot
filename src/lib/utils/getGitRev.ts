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

  let rev = (await fs.readFile(path.join(process.cwd(), '.git', 'HEAD'))).toString();
  if (rev.includes(':'))
    rev = (await fs.readFile(path.join(process.cwd(), '.git', rev.slice(5).trim()))).toString();

  cachedCommit = rev;
  return rev;
}
