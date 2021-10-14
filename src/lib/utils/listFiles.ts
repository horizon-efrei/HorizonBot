import { readdir } from 'node:fs/promises';

/**
 * Get all the names of the files in a folder.
 * @param string The path of the folder
 * @returns An array of the file names
 */

export default async function listFiles(folder: string): Promise<string[]> {
    const fileNames = readdir(folder);
    return fileNames;
}
