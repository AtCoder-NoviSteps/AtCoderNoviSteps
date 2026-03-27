import { describe, expect, it } from 'vitest';

import { TaskGrade, taskGradeValues } from '$lib/types/task';

import { nonPendingGrades } from './grade_options';

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
