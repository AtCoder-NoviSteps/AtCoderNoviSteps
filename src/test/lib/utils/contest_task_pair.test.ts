import { describe, test, expect } from 'vitest';

import { createContestTaskPairKey } from '$lib/utils/contest_task_pair';

describe('createContestTaskPairKey', () => {
  // Test data structure
  interface TestPair {
    contestId: string;
    taskId: string;
  }

  type TestPairs = readonly TestPair[];

  // Helper to create test pairs
  const pairs = {
    normal: [
      { contestId: 'abc100', taskId: 'abc100_a' },
      { contestId: 'abc397', taskId: 'abc397_g' },
      { contestId: 'arc050', taskId: 'arc050_a' },
      { contestId: 'dp', taskId: 'dp_a' },
      { contestId: 'tdpc', taskId: 'tdpc_a' },
      { contestId: 'typical90', taskId: 'typical90_a' },
      { contestId: 'typical90', taskId: 'typical90_cl' },
      { contestId: 'tessoku-book', taskId: 'abc007_3' },
      { contestId: 'tessoku-book', taskId: 'math_and_algorithm_am' },
      { contestId: 'tessoku-book', taskId: 'typical90_s' },
      { contestId: 'joi2024yo1a', taskId: 'joi2024yo1a_a' },
    ] as const,
    edge: [
      { contestId: '', taskId: '' },
      { contestId: 'abc123', taskId: '' },
      { contestId: '', taskId: 'abc123_a' },
      { contestId: '123', taskId: '456' },
      { contestId: '_', taskId: '_' },
      { contestId: 'abc_123_def', taskId: 'task_id_part' },
      { contestId: 'abc-123', taskId: 'task-id' },
      { contestId: 'a', taskId: 'b' },
      { contestId: 'abc 123', taskId: 'abc123 a' },
      { contestId: 'abc.123', taskId: 'abc123.a' },
    ] as const,
    anomaly: [
      { contestId: 'abc|123', taskId: 'abc123_a' },
      { contestId: 'abc123', taskId: 'abc|123_a' },
      { contestId: 'abc|123', taskId: 'abc|123_a' },
      { contestId: 'abc||123', taskId: 'task||id' },
      { contestId: 'abc.*+?^${}()', taskId: 'task[a-z]' },
      { contestId: 'abc:123', taskId: 'task_a' },
      { contestId: 'abc123', taskId: 'task:a' },
      { contestId: 'abc:123', taskId: 'task:a' },
      { contestId: 'abc日本語123', taskId: 'task日本語a' },
      { contestId: 'abc😀', taskId: 'task😀' },
      { contestId: 'abc\n123', taskId: 'task\na' },
      { contestId: 'abc\t123', taskId: 'task\ta' },
    ] as const,
  };

  // Helper functions:
  // To generate expected key
  const getExpectedKey = (contestId: string, taskId: string) => `${contestId}:${taskId}`;

  // To create a key from a pair
  const createTestKey = (pair: TestPair): string =>
    createContestTaskPairKey(pair.contestId, pair.taskId);

  // To compare two keys for consistency
  const expectKeysToBeConsistent = (pair: TestPair): void => {
    const key1 = createTestKey(pair);
    const key2 = createTestKey(pair);

    expect(key1).toBe(key2);
  };

  // To compare keys for difference
  const expectKeysDifferent = (pair1: TestPair, pair2: TestPair): void => {
    const key1 = createTestKey(pair1);
    const key2 = createTestKey(pair2);

    expect(key1).not.toBe(key2);
  };

  // To run test for multiple pairs
  const testMultiplePairs = (
    pairList: TestPairs,
    validator: (pair: TestPair, key: string) => void,
  ): void => {
    pairList.forEach((pair) => {
      const key = createTestKey(pair);
      validator(pair, key);
    });
  };

  describe('Base cases', () => {
    test('expects to create a key with valid contest_id and task_id', () => {
      const pair = pairs.normal[0];
      const key = createTestKey(pair);

      expect(key).toBe(getExpectedKey(pair.contestId, pair.taskId));
      expect(typeof key).toBe('string');
    });

    test('expects to create different keys for different contest_ids', () => {
      const pair = pairs.normal[0];
      const modifiedPair = { ...pair, contestId: 'abc124' };

      expectKeysDifferent(pair, modifiedPair);
    });

    test('expects to create different keys for different task_ids', () => {
      const pair = pairs.normal[0];
      const modifiedPair = { ...pair, taskId: 'abc100_b' };

      expectKeysDifferent(pair, modifiedPair);
    });

    test('expects to create consistent keys for the same inputs', () => {
      const pair = pairs.normal[0];

      expectKeysToBeConsistent(pair);
    });

    test('expects to work with various contest types', () => {
      testMultiplePairs(pairs.normal, ({ contestId, taskId }) => {
        const pair = { contestId, taskId };
        const key = createTestKey(pair);

        expect(key).toBe(getExpectedKey(contestId, taskId));
      });
    });

    test('expects to work with uppercase and lowercase characters', () => {
      const pair1 = { contestId: 'ABC123', taskId: 'ABC123_A' };
      const pair2 = { contestId: 'abc123', taskId: 'abc123_a' };

      expectKeysDifferent(pair1, pair2);
    });

    test('expects to work with numeric task identifiers', () => {
      const pair = pairs.normal[5]; // typical90_a
      const key = createTestKey(pair);

      expect(key).toBe(getExpectedKey(pair.contestId, pair.taskId));
    });

    test('expects to work with long contest and task IDs', () => {
      const pair = {
        contestId: 'a'.repeat(50),
        taskId: 'a'.repeat(50) + '_' + 'b'.repeat(50),
      };
      const key = createTestKey(pair);

      expect(key).toBe(getExpectedKey(pair.contestId, pair.taskId));
    });
  });

  describe('Edge cases', () => {
    test('expects all edge cases to format correctly', () => {
      // Filter out empty string cases as they should throw
      const validEdgePairs = pairs.edge.filter(
        (pair) => pair.contestId.trim() !== '' && pair.taskId.trim() !== '',
      );

      testMultiplePairs(validEdgePairs, ({ contestId, taskId }) => {
        const pair = { contestId, taskId };
        const key = createTestKey(pair);

        expect(key).toBe(getExpectedKey(contestId, taskId));
      });
    });

    test.each<[string, string, string]>([
      ['', 'abc123_a', 'contestId must be a non-empty string'],
      ['   ', 'abc123_a', 'contestId must be a non-empty string'],
      ['abc123', '', 'taskId must be a non-empty string'],
      ['abc123', '   ', 'taskId must be a non-empty string'],
    ])(
      'expects error when contest_id="%s" and task_id="%s"',
      (contestId, taskId, expectedError) => {
        expect(() => createContestTaskPairKey(contestId, taskId)).toThrow(expectedError);
      },
    );

    test('expects to preserve order of contest_id and task_id', () => {
      const pair1 = pairs.normal[0];
      const pair2 = { contestId: pair1.taskId, taskId: pair1.contestId };

      expectKeysDifferent(pair1, pair2);
    });

    test('expects to include the colon separator', () => {
      const pair = pairs.normal[0];
      const key = createTestKey(pair);

      expect(key).toContain(':');
      expect(key.split(':')).toHaveLength(2);
    });
  });

  describe('Anomaly cases', () => {
    test('expects anomaly cases with special characters to format correctly', () => {
      // Filter out pipe character cases for basic testing
      const specialCharCases = pairs.anomaly.slice(4);

      testMultiplePairs(specialCharCases, ({ contestId, taskId }) => {
        const pair = { contestId, taskId };
        const key = createTestKey(pair);

        expect(key).toBe(getExpectedKey(contestId, taskId));
      });
    });

    test.each<[TestPair, string, string]>([
      [{ contestId: 'abc|123', taskId: 'abc123_a' }, 'abc|123:abc123_a', 'pipe in contest_id'],
      [{ contestId: 'abc123', taskId: 'abc|123_a' }, 'abc123:abc|123_a', 'pipe in task_id'],
      [{ contestId: 'abc|123', taskId: 'abc|123_a' }, 'abc|123:abc|123_a', 'pipes in both IDs'],
      [
        { contestId: 'abc||123', taskId: 'task||id' },
        'abc||123:task||id',
        'multiple consecutive pipes',
      ],
      [{ contestId: 'abc:123', taskId: 'task_a' }, 'abc:123:task_a', 'colon in contest_id'],
      [{ contestId: 'abc123', taskId: 'task:a' }, 'abc123:task:a', 'colon in task_id'],
      [{ contestId: 'abc:123', taskId: 'task:a' }, 'abc:123:task:a', 'colons in both IDs'],
    ])('expects special characters to be preserved (%s)', (pair, expected) => {
      const key = createTestKey(pair);
      expect(key).toBe(expected);
    });

    test('expects to handle very long contest_id without issues', () => {
      const pair = { contestId: 'a'.repeat(1000), taskId: 'task_a' };
      const key = createTestKey(pair);

      expect(key).toBe(getExpectedKey(pair.contestId, pair.taskId));
    });

    test('expects to handle very long task_id without issues', () => {
      const pair = { contestId: 'contest', taskId: 'b'.repeat(1000) };
      const key = createTestKey(pair);

      expect(key).toBe(getExpectedKey(pair.contestId, pair.taskId));
    });
  });

  describe('Key validation', () => {
    test('expects key to be parseable back into components', () => {
      testMultiplePairs(pairs.normal, ({ contestId, taskId }) => {
        const pair = { contestId, taskId };
        const key = createTestKey(pair);
        const [parsedContestId, parsedTaskId] = key.split(':');

        expect(parsedContestId).toBe(contestId);
        expect(parsedTaskId).toBe(taskId);
      });
    });

    test('expects key with colon separator to be splittable into two parts', () => {
      const pair = pairs.normal[0];
      const key = createTestKey(pair);
      const parts = key.split(':');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe(pair.contestId);
      expect(parts[1]).toBe(pair.taskId);
    });

    test('expects all keys to follow the same format pattern', () => {
      const keys = pairs.normal.map((pair) => createTestKey(pair));

      keys.forEach((key) => {
        expect(key).toMatch(/^.+:.+$/);
      });
    });

    test('expects multiple keys to be unique', () => {
      const keys = pairs.normal.map((pair) => createTestKey(pair));
      const uniqueKeys = new Set(keys);

      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
