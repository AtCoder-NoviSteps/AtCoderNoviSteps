import { describe, test, expect } from 'vitest';

import {
  buildEndpoint,
  mapToContest,
  assignProblemIndices,
  mapToTask,
  getCourseName,
} from './utils';
import { PENDING } from './types';
import type { AOJTaskAPI } from './types';

describe('buildEndpoint', () => {
  describe('successful cases', () => {
    test('joins single segment', () => {
      expect(buildEndpoint(['challenges'])).toBe('challenges');
    });

    test('joins multiple segments with slash', () => {
      expect(buildEndpoint(['challenges', 'cl', 'PCK', 'PRELIM'])).toBe('challenges/cl/PCK/PRELIM');
    });

    test('encodes segments with URI encoding', () => {
      expect(buildEndpoint(['challenges', 'cl', 'JAG', 'REGIONAL'])).toBe(
        'challenges/cl/JAG/REGIONAL',
      );
    });

    test('accepts segments with hyphens and underscores', () => {
      expect(buildEndpoint(['some-segment', 'other_segment'])).toBe('some-segment/other_segment');
    });
  });

  describe('error cases', () => {
    test('throws when segments array is empty', () => {
      expect(() => buildEndpoint([])).toThrow('Endpoint segments array cannot be empty');
    });

    test('throws when segment contains invalid characters', () => {
      expect(() => buildEndpoint(['invalid segment'])).toThrow('Invalid segment');
    });

    test('throws when segment contains path traversal', () => {
      expect(() => buildEndpoint(['..'])).toThrow('Invalid segment');
    });

    test('throws when segment exceeds max length', () => {
      expect(() => buildEndpoint(['a'.repeat(101)])).toThrow('Invalid segment');
    });
  });
});

describe('mapToContest', () => {
  describe('successful cases', () => {
    test('trims trailing whitespace from title', () => {
      expect(mapToContest('PCK2024', 'PCK 2024 Preliminary  ').title).toBe('PCK 2024 Preliminary');
      expect(mapToContest('JAG2023', 'JAG Regional 2023\t').title).toBe('JAG Regional 2023');
    });

    test('maps contestId and title to ContestForImport shape', () => {
      const result = mapToContest('PCK2024', 'PCK 2024 Preliminary');

      expect(result).toEqual({
        id: 'PCK2024',
        title: 'PCK 2024 Preliminary',
        start_epoch_second: PENDING,
        duration_second: PENDING,
        rate_change: '',
      });
    });

    test('sets PENDING for start_epoch_second and duration_second', () => {
      const result = mapToContest('ITP1', 'Introduction to Programming');

      expect(result.start_epoch_second).toBe(PENDING);
      expect(result.duration_second).toBe(PENDING);
    });

    test('sets empty string for rate_change', () => {
      const result = mapToContest('JAG2023', 'JAG Regional 2023');
      expect(result.rate_change).toBe('');
    });
  });
});

describe('assignProblemIndices', () => {
  describe('letters for ICPC and JAG', () => {
    test.each([
      [
        'ICPC',
        ['1665', '1664', '1666'],
        [
          ['1664', 'A'],
          ['1665', 'B'],
          ['1666', 'C'],
        ],
      ],
      [
        'JAG',
        ['3454', '3452', '3453'],
        [
          ['3452', 'A'],
          ['3453', 'B'],
          ['3454', 'C'],
        ],
      ],
    ] as const)(
      'assigns letters A, B, C... in ascending problem id order for %s',
      (contestType, problemIds, expected) => {
        expect(assignProblemIndices(contestType, [...problemIds])).toEqual(new Map(expected));
      },
    );

    test('assigns letters A through L to the 12 problems of ICPC Regional 2024', () => {
      const problemIds = Array.from({ length: 12 }, (_, i) => String(1455 + i));
      const result = assignProblemIndices('ICPC', problemIds);

      expect(result.get('1455')).toBe('A');
      expect(result.get('1466')).toBe('L');
      expect(result.size).toBe(12);
    });

    test('sorts problem ids numerically, not lexicographically', () => {
      const result = assignProblemIndices('ICPC', ['10000', '9999']);

      expect(result.get('9999')).toBe('A');
      expect(result.get('10000')).toBe('B');
    });

    test('assigns A to a single problem', () => {
      expect(assignProblemIndices('JAG', ['1100'])).toEqual(new Map([['1100', 'A']]));
    });
  });

  describe('numbers for PCK', () => {
    test('assigns one-based numbers in ascending problem id order', () => {
      expect(assignProblemIndices('PCK', ['0098', '0001', '0000', '0096'])).toEqual(
        new Map([
          ['0000', '1'],
          ['0001', '2'],
          ['0096', '3'],
          ['0098', '4'],
        ]),
      );
    });

    test('keeps numbers numeric after nine problems', () => {
      const problemIds = [
        '4070',
        '4069',
        '4068',
        '4067',
        '4066',
        '4065',
        '4064',
        '4063',
        '4062',
        '4061',
        '4060',
      ];
      const result = assignProblemIndices('PCK', problemIds);

      expect(result.get('4060')).toBe('1');
      expect(result.get('4069')).toBe('10');
      expect(result.get('4070')).toBe('11');
    });
  });

  describe('edge cases', () => {
    test.each(['ICPC', 'JAG', 'PCK'] as const)(
      'returns an empty map for empty input for %s',
      (contestType) => {
        expect(assignProblemIndices(contestType, [])).toEqual(new Map());
      },
    );

    test('does not mutate the input array', () => {
      const problemIds = ['0098', '0001', '0000'];
      assignProblemIndices('PCK', problemIds);

      expect(problemIds).toEqual(['0098', '0001', '0000']);
    });
  });
});

describe('mapToTask', () => {
  const baseTask: AOJTaskAPI = {
    id: 'ITP1_1_A',
    available: 1,
    doctype: 0,
    name: 'Hello, World!',
    problemTimeLimit: 1000,
    problemMemoryLimit: 65536,
    maxScore: 100,
    solvedUser: 5000,
    submissions: 10000,
    recommendations: 100,
    isSolved: false,
    bookmark: false,
    recommend: false,
    successRate: 50.0,
    score: 0,
    userScore: 0,
  };

  describe('successful cases', () => {
    test('maps problem id, contest_id, and name', () => {
      const result = mapToTask(baseTask, 'ITP1');

      expect(result).toEqual({
        id: 'ITP1_1_A',
        contest_id: 'ITP1',
        problem_index: 'ITP1_1_A',
        task_id: 'ITP1_1_A',
        title: 'Hello, World!',
      });
    });

    test('uses problem.id as problem_index and task_id', () => {
      const result = mapToTask(baseTask, 'ITP1');

      expect(result.problem_index).toBe(baseTask.id);
      expect(result.task_id).toBe(baseTask.id);
    });

    test('uses the given problemIndex instead of the problem id', () => {
      const icpcTask: AOJTaskAPI = { ...baseTask, id: '1677', name: 'Billiards' };
      const result = mapToTask(icpcTask, 'ICPCPrelim2024', 'F');

      expect(result.problem_index).toBe('F');
      expect(result.task_id).toBe('1677');
    });

    test('uses problem.name as title', () => {
      const result = mapToTask(baseTask, 'ITP1');
      expect(result.title).toBe('Hello, World!');
    });

    test('trims trailing whitespace from problem name', () => {
      const taskWithWhitespace: AOJTaskAPI = { ...baseTask, name: 'Hello, World!  ' };
      expect(mapToTask(taskWithWhitespace, 'ITP1').title).toBe('Hello, World!');
    });
  });
});

describe('getCourseName', () => {
  describe('successful cases', () => {
    test('returns course name for ITP1 style task ID', () => {
      expect(getCourseName('ITP1_1_A')).toBe('ITP1');
    });

    test('returns course name for INFO1 style task ID', () => {
      expect(getCourseName('INFO1_01_E')).toBe('INFO1');
    });

    test('returns course name for ALDS1 style task ID', () => {
      expect(getCourseName('ALDS1_1_A')).toBe('ALDS1');
    });
  });

  describe('edge cases', () => {
    test('for challenge numeric task ID (no underscores)', () => {
      expect(getCourseName('0001')).toBe('');
    });

    test('for task ID with only two underscore-separated parts', () => {
      expect(getCourseName('ITP1_1')).toBe('');
    });

    test('for task ID with more than three parts', () => {
      expect(getCourseName('ITP1_1_A_extra')).toBe('');
    });

    test('for empty string', () => {
      expect(getCourseName('')).toBe('');
    });
  });
});
