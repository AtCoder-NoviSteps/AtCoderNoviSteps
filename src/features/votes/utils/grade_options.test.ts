import { describe, expect, it, test } from 'vitest';

import { TaskGrade, taskGradeValues } from '$lib/types/task';

import { resolveDisplayGrade, nonPendingGrades, qGrades, dGrades } from './grade_options';

describe('resolveDisplayGrade', () => {
  test('returns the grade as-is when it is not PENDING', () => {
    expect(resolveDisplayGrade(TaskGrade.Q1, TaskGrade.Q2)).toBe(TaskGrade.Q1);
  });

  test('returns estimatedGrade when grade is PENDING and estimatedGrade is provided', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING, TaskGrade.Q3)).toBe(TaskGrade.Q3);
  });

  test('returns PENDING when grade is PENDING and estimatedGrade is null', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING, null)).toBe(TaskGrade.PENDING);
  });

  test('returns PENDING when grade is PENDING and estimatedGrade is undefined', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING)).toBe(TaskGrade.PENDING);
  });
});

describe('nonPendingGrades', () => {
  it('does not include PENDING', () => {
    expect(nonPendingGrades).not.toContain(TaskGrade.PENDING);
  });

  it('contains all grades except PENDING', () => {
    const expected = taskGradeValues.filter((grade) => grade !== TaskGrade.PENDING);
    expect(nonPendingGrades).toEqual(expected);
  });

  it('starts with Q11 and ends with D6', () => {
    expect(nonPendingGrades[0]).toBe(TaskGrade.Q11);
    expect(nonPendingGrades[nonPendingGrades.length - 1]).toBe(TaskGrade.D6);
  });
});

describe('qGrades', () => {
  it('contains only Q-tier grades', () => {
    expect(qGrades.every((g) => g.startsWith('Q'))).toBe(true);
  });

  it('contains no D-tier grades', () => {
    expect(qGrades.some((g) => g.startsWith('D'))).toBe(false);
  });

  it('equals nonPendingGrades filtered to Q prefix', () => {
    expect(qGrades).toEqual(nonPendingGrades.filter((g) => g.startsWith('Q')));
  });

  it('starts with Q11 and ends with Q1', () => {
    expect(qGrades[0]).toBe(TaskGrade.Q11);
    expect(qGrades[qGrades.length - 1]).toBe(TaskGrade.Q1);
  });
});

describe('dGrades', () => {
  it('contains only D-tier grades', () => {
    expect(dGrades.every((g) => g.startsWith('D'))).toBe(true);
  });

  it('contains no Q-tier grades', () => {
    expect(dGrades.some((g) => g.startsWith('Q'))).toBe(false);
  });

  it('equals nonPendingGrades filtered to D prefix', () => {
    expect(dGrades).toEqual(nonPendingGrades.filter((g) => g.startsWith('D')));
  });

  it('starts with D1 and ends with D6', () => {
    expect(dGrades[0]).toBe(TaskGrade.D1);
    expect(dGrades[dGrades.length - 1]).toBe(TaskGrade.D6);
  });
});
