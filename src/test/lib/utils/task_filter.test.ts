import { describe, test, expect } from 'vitest';
import { filterTasksBySearch } from '$lib/utils/task_filter';

const tasks = [
  { title: 'ABC 300 A - N-choice question', task_id: 'abc300_a', contest_id: 'abc300' },
  { title: 'ARC 150 B - Count ABC', task_id: 'arc150_b', contest_id: 'arc150' },
  { title: 'AGC 060 C - No Majority', task_id: 'agc060_c', contest_id: 'agc060' },
  { title: 'ABC 301 A - Overall Winner', task_id: 'abc301_a', contest_id: 'abc301' },
  { title: 'ABC 302 A - Attack', task_id: 'abc302_a', contest_id: 'abc302' },
  // title intentionally omits '典型' so only getContestNameLabel matches '競プロ典型 90 問'
  { title: 'Shortest Path', task_id: 'typical90_a', contest_id: 'typical90' },
  // AOJ problem (contest_id starts with 'ICPC' → AojGenerator)
  { title: 'Fast Forwarding', task_id: '1400', contest_id: 'ICPCRegional2019' },
];

describe('filterTasksBySearch', () => {
  describe('matches', () => {
    test('by title (case-insensitive)', () => {
      const result = filterTasksBySearch(tasks, 'n-choice question', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('abc300_a');
    });

    test('by task_id', () => {
      const result = filterTasksBySearch(tasks, 'arc150_b', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('arc150_b');
    });

    test('by contest_id', () => {
      const result = filterTasksBySearch(tasks, 'agc060', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('agc060_c');
    });

    test('by contest name label when title does not contain the label', () => {
      // getContestNameLabel('typical90') => '競プロ典型 90 問'; title is 'Shortest Path' — no overlap
      const result = filterTasksBySearch(tasks, '競プロ典型 90 問', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('typical90_a');
    });

    test('by AtCoder URL', () => {
      const result = filterTasksBySearch(
        tasks,
        'https://atcoder.jp/contests/abc300/tasks/abc300_a',
        20,
      );
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('abc300_a');
    });

    test('by partial AtCoder URL', () => {
      const result = filterTasksBySearch(tasks, 'atcoder.jp/contests/abc300', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('abc300_a');
    });

    test('by AOJ URL', () => {
      const result = filterTasksBySearch(
        tasks,
        'https://onlinejudge.u-aizu.ac.jp/problems/1400',
        20,
      );
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('1400');
    });

    test('trims leading and trailing whitespace before matching', () => {
      const result = filterTasksBySearch(tasks, '  arc150_b  ', 20);
      expect(result).toHaveLength(1);
      expect(result[0].task_id).toBe('arc150_b');
    });
  });

  describe('does not match', () => {
    test('returns empty array when search is empty', () => {
      expect(filterTasksBySearch(tasks, '', 20)).toEqual([]);
    });

    test('returns empty array when search is whitespace only', () => {
      expect(filterTasksBySearch(tasks, '   ', 20)).toEqual([]);
    });

    test('returns empty array when no tasks match', () => {
      expect(filterTasksBySearch(tasks, 'zzzzz', 20)).toEqual([]);
    });
  });

  describe('limit and order', () => {
    test('applies limit to results', () => {
      // abc300, abc301, abc302 all match 'abc30'
      const result = filterTasksBySearch(tasks, 'abc30', 2);
      expect(result).toHaveLength(2);
    });

    test('preserves input order — sorting is the caller responsibility', () => {
      const result = filterTasksBySearch(tasks, 'abc30', 3);
      expect(result.map((task) => task.task_id)).toEqual(['abc300_a', 'abc301_a', 'abc302_a']);
    });

    test('returns all matched results when count is less than limit', () => {
      const result = filterTasksBySearch(tasks, 'arc', 20);
      expect(result).toHaveLength(1);
    });
  });
});
