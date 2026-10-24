import { describe, test, expect } from 'vitest';

import {
  buildEndpoint,
  mapToContest,
  assignProblemLetters,
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

describe('assignProblemLetters', () => {
  describe('successful cases', () => {
    test('assigns letters A, B, C... in ascending problem id order', () => {
      const result = assignProblemLetters(['1665', '1664', '1666']);

      expect(result).toEqual(
        new Map([
          ['1664', 'A'],
          ['1665', 'B'],
          ['1666', 'C'],
        ]),
      );
    });

    test('assigns letters A through L to the 12 problems of ICPC Regional 2024', () => {
      const problemIds = Array.from({ length: 12 }, (_, i) => String(1455 + i));
      const result = assignProblemLetters(problemIds);

      expect(result.get('1455')).toBe('A');
      expect(result.get('1466')).toBe('L');
      expect(result.size).toBe(12);
    });

    test('sorts problem ids numerically, not lexicographically', () => {
      const result = assignProblemLetters(['10000', '9999']);

      expect(result.get('9999')).toBe('A');
      expect(result.get('10000')).toBe('B');
    });

    test('does not mutate the input array', () => {
      const problemIds = ['1665', '1664'];
      assignProblemLetters(problemIds);

      expect(problemIds).toEqual(['1665', '1664']);
    });
  });

  describe('edge cases', () => {
    test('returns an empty map for empty input', () => {
      expect(assignProblemLetters([]).size).toBe(0);
    });

    test('assigns A to a single problem', () => {
      expect(assignProblemLetters(['1100'])).toEqual(new Map([['1100', 'A']]));
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
