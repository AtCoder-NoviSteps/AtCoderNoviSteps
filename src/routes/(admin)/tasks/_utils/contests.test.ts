import { describe, test, expect } from 'vitest';
import { filterContests } from './contests';
import type { Contests } from '$lib/types/contest';

const contests: Contests = [
  {
    id: 'abc300',
    title: 'AtCoder Beginner Contest 300',
    tasks: [
      { id: 'abc300_a', task_id: 'abc300_a', contest_id: 'abc300', problem_index: 'A', title: 'N-choice question' },
    ],
    start_epoch_second: 0,
    duration_second: 0,
  },
  {
    id: 'abc301',
    title: 'AtCoder Beginner Contest 301',
    tasks: [{ id: 'abc301_a', task_id: 'abc301_a', contest_id: 'abc301', problem_index: 'A', title: 'Overall Winner' }],
    start_epoch_second: 0,
    duration_second: 0,
  },
  {
    id: 'abc302',
    title: 'AtCoder Beginner Contest 302',
    tasks: [],
    start_epoch_second: 0,
    duration_second: 0,
  },
];

describe('filterContests', () => {
  describe('when query is empty', () => {
    test('returns contests that have tasks', () => {
      expect(filterContests(contests, '')).toHaveLength(2);
    });

    test('excludes contests with no tasks', () => {
      const result = filterContests(contests, '');
      expect(result.every((contest) => contest.tasks.length > 0)).toBe(true);
    });
  });

  describe('when query matches', () => {
    test('filters by contest id', () => {
      const result = filterContests(contests, 'abc300');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc300');
    });

    test('filters by contest title', () => {
      const result = filterContests(contests, 'Beginner Contest 301');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc301');
    });

    test('filters by task title', () => {
      const result = filterContests(contests, 'Overall Winner');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc301');
    });

    test('is case-insensitive', () => {
      expect(filterContests(contests, 'OVERALL WINNER')).toHaveLength(1);
    });
  });

  describe('when query does not match', () => {
    test('returns empty array', () => {
      expect(filterContests(contests, 'zzz_no_match')).toHaveLength(0);
    });

    test('excludes contests with no tasks even if id matches', () => {
      const result = filterContests(contests, 'abc302');
      expect(result).toHaveLength(0);
    });
  });
});
