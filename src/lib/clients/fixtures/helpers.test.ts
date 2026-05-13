import path from 'path';
import fs from 'fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { loadMockData } from './helpers';

describe('loadMockData', () => {
  const testDir = __dirname;
  const mockFilePath = path.join(testDir, 'mockData.json');
  const mockData = { key: 'value' };

  beforeAll(() => {
    fs.writeFileSync(mockFilePath, JSON.stringify(mockData));
  });

  afterAll(() => {
    const testFiles = ['mockData.json', 'invalidJson.json'];

    testFiles.forEach((file) => {
      const filePath = path.join(testDir, file);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  it('expects to load and parse mock data from a file', () => {
    const data = loadMockData<typeof mockData>(mockFilePath);
    expect(data).toEqual(mockData);
  });

  it('expects to throw an error if the file does not exist', () => {
    const invalidFilePath = path.resolve(__dirname, 'nonExistentFile.json');
    expect(() => loadMockData<typeof mockData>(invalidFilePath)).toThrow();
  });

  it('expects to throw an error if the file content is not valid JSON', () => {
    const invalidJsonFilePath = path.resolve(__dirname, 'invalidJson.json');
    fs.writeFileSync(invalidJsonFilePath, 'invalid json');

    try {
      expect(() => loadMockData<typeof mockData>(invalidJsonFilePath)).toThrow();
    } finally {
      if (fs.existsSync(invalidJsonFilePath)) {
        fs.unlinkSync(invalidJsonFilePath);
      }
    }
  });
});
