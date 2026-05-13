import path from 'path';
import fs from 'fs';

/**
 * Loads mock data from a specified file path and parses it as JSON.
 *
 * @template T - The type to which the parsed JSON should be cast.
 * @param {string} filePath - The path to the file containing the mock data.
 * @returns {T} - The parsed mock data cast to the specified type.
 */
export const loadMockData = <T>(filePath: string): T => {
  const testDataPath = path.resolve(filePath);

  try {
    return JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as T;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Mock data file not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in mock data file: ${filePath}`);
      }
    }

    throw error;
  }
};
