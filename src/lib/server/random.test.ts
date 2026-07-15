import { describe, test, expect } from 'vitest';

import { generateRandomString } from './random';

const ALPHABET_PATTERN = /^[a-z0-9]+$/;

describe('generateRandomString', () => {
  test.each([16, 15, 40])('returns a string of the requested length (%i)', (length) => {
    expect(generateRandomString(length)).toHaveLength(length);
  });

  test('returns only characters from the 36-char [a-z0-9] alphabet', () => {
    // 1000 samples across the lengths lucia v2 uses (salt / user id / session id)
    for (let i = 0; i < 1000; i++) {
      expect(generateRandomString(40)).toMatch(ALPHABET_PATTERN);
    }
  });

  test('returns a different value on each call (no collisions)', () => {
    const values = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      values.add(generateRandomString(40));
    }

    expect(values.size).toBe(1000);
  });
});
