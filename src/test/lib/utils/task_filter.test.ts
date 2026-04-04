import { describe, test, expect } from 'vitest';
import { filterTasksBySearch } from '$lib/utils/task_filter';

const tasks = [
  { title: 'ABC 300 A - N-choice question', task_id: 'abc300_a', contest_id: 'abc300' },
  { title: 'ARC 150 B - Count ABC', task_id: 'arc150_b', contest_id: 'arc150' },
  { title: 'AGC 060 C - No Majority', task_id: 'agc060_c', contest_id: 'agc060' },
  { title: 'ABC 301 A - Overall Winner', task_id: 'abc301_a', contest_id: 'abc301' },
  { title: 'ABC 302 A - Attack', task_id: 'abc302_a', contest_id: 'abc302' },
];

describe('filterTasksBySearch', () => {
  test('returns empty array when search is empty', () => {
    expect(filterTasksBySearch(tasks, '', 20)).toEqual([]);
  });

  test('matches by title (case-insensitive)', () => {
    const result = filterTasksBySearch(tasks, 'n-choice question', 20);
    expect(result).toHaveLength(1);
    expect(result[0].task_id).toBe('abc300_a');
  });

  test('matches by task_id', () => {
    const result = filterTasksBySearch(tasks, 'arc150_b', 20);
    expect(result).toHaveLength(1);
    expect(result[0].task_id).toBe('arc150_b');
  });

  test('matches by contest_id', () => {
    const result = filterTasksBySearch(tasks, 'agc060', 20);
    expect(result).toHaveLength(1);
    expect(result[0].task_id).toBe('agc060_c');
  });

  test('matches by contest name label (e.g. "ABC 300")', () => {
    // getContestNameLabel('abc300') => 'ABC 300'
    const result = filterTasksBySearch(tasks, 'ABC 300', 20);
    expect(result).toHaveLength(1);
    expect(result[0].task_id).toBe('abc300_a');
  });

  test('returns empty array when no tasks match', () => {
    expect(filterTasksBySearch(tasks, 'zzzzz', 20)).toEqual([]);
  });

  test('applies limit to results', () => {
    // abc300, abc301, abc302 all match 'abc30'
    const result = filterTasksBySearch(tasks, 'abc30', 2);
    expect(result).toHaveLength(2);
  });

  test('returns all matched results when count is less than limit', () => {
    const result = filterTasksBySearch(tasks, 'arc', 20);
    expect(result).toHaveLength(1);
  });
});
