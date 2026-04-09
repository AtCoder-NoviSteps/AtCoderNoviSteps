import { describe, test, expect } from 'vitest';

import { taskGradeValues, TaskGrade } from '$lib/types/task';
import { isValidTaskGrade } from '$lib/utils/task_grade';

describe('isValidTaskGrade', () => {
  describe('successful cases', () => {
    test('returns true for all valid TaskGrade values', () => {
      taskGradeValues.forEach((grade) => {
        expect(isValidTaskGrade(grade)).toBe(true);
      });
    });

    test('is a type guard that narrows type to TaskGrade', () => {
      const value: unknown = 'Q1';

      if (isValidTaskGrade(value)) {
        // value is narrowed to TaskGrade at this point
        const grade: typeof value = value;
        expect(grade).toBe(TaskGrade.Q1);
      }
    });
  });

  describe('failure cases', () => {
    test('returns false for invalid string values', () => {
      expect(isValidTaskGrade('INVALID')).toBe(false);
      expect(isValidTaskGrade('invalid')).toBe(false);
      expect(isValidTaskGrade('PENDING_')).toBe(false);
    });

    test('returns false for non-string values', () => {
      expect(isValidTaskGrade(null)).toBe(false);
      expect(isValidTaskGrade(undefined)).toBe(false);
      expect(isValidTaskGrade(123)).toBe(false);
      expect(isValidTaskGrade(true)).toBe(false);
      expect(isValidTaskGrade({})).toBe(false);
      expect(isValidTaskGrade([])).toBe(false);
    });
  });
});
