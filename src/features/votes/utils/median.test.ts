import { describe, expect, it } from 'vitest';

import { TaskGrade } from '@prisma/client';

import { computeMedianGrade } from './median';

describe('computeMedianGrade', () => {
  it('returns null when total votes is below minVotes (default 3)', () => {
    const counters = [
      { grade: TaskGrade.Q5, count: 1 },
      { grade: TaskGrade.Q4, count: 1 },
    ];
    expect(computeMedianGrade(counters)).toBeNull();
  });

  it('returns null when counters are empty', () => {
    expect(computeMedianGrade([])).toBeNull();
  });

  it('returns null when total is exactly minVotes - 1', () => {
    const counters = [{ grade: TaskGrade.Q3, count: 2 }];
    expect(computeMedianGrade(counters)).toBeNull();
  });

  it('returns the median for an odd total (single grade, 3 votes)', () => {
    const counters = [{ grade: TaskGrade.Q5, count: 3 }];
    expect(computeMedianGrade(counters)).toBe(TaskGrade.Q5);
  });

  it('returns the median for an odd total (multiple grades)', () => {
    // votes: Q11, Q5, Q5 → sorted: Q11(1), Q5(2) → median is 2nd = Q5
    const counters = [
      { grade: TaskGrade.Q11, count: 1 },
      { grade: TaskGrade.Q5, count: 2 },
    ];
    expect(computeMedianGrade(counters)).toBe(TaskGrade.Q5);
  });

  it('returns the lower-rounded median for an even total', () => {
    // votes: Q7(2), Q5(2) → positions 2=Q7, 3=Q5 → avg order → rounds to Q6
    const counters = [
      { grade: TaskGrade.Q7, count: 2 },
      { grade: TaskGrade.Q5, count: 2 },
    ];
    expect(computeMedianGrade(counters)).toBe(TaskGrade.Q6);
  });

  it('returns same grade when all votes are the same', () => {
    const counters = [{ grade: TaskGrade.D1, count: 5 }];
    expect(computeMedianGrade(counters)).toBe(TaskGrade.D1);
  });

  it('handles votes concentrated at the extremes (Q11 and D6)', () => {
    // 3 votes for Q11, 3 votes for D6 → order avg of (1+17)/2 = 9 = Q3
    const counters = [
      { grade: TaskGrade.Q11, count: 3 },
      { grade: TaskGrade.D6, count: 3 },
    ];
    expect(computeMedianGrade(counters)).toBe(TaskGrade.Q3);
  });

  it('respects a custom minVotes threshold', () => {
    const counters = [{ grade: TaskGrade.Q5, count: 2 }];
    expect(computeMedianGrade(counters, 2)).toBe(TaskGrade.Q5);
  });
});
