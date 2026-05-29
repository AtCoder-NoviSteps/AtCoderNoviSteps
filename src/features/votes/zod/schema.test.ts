import { describe, expect, test } from 'vitest';
import { TaskGrade } from '@prisma/client';

import { voteAbsoluteGradeSchema } from '$features/votes/zod/schema';

describe('voteAbsoluteGradeSchema', () => {
  function validate(data: unknown): boolean {
    return voteAbsoluteGradeSchema.safeParse(data).success;
  }

  describe('valid inputs', () => {
    test('ABC task with Q-grade', () => {
      expect(validate({ taskId: 'abc408_a', grade: TaskGrade.Q7 })).toBe(true);
    });

    test('ARC task with D-grade', () => {
      expect(validate({ taskId: 'arc188_c', grade: TaskGrade.D3 })).toBe(true);
    });

    test('ABC G problem with D6 grade', () => {
      expect(validate({ taskId: 'abc399_g', grade: TaskGrade.D6 })).toBe(true);
    });

    test('AOJ 4-digit task ID', () => {
      expect(validate({ taskId: '1001', grade: TaskGrade.Q5 })).toBe(true);
    });

    test('taskId with surrounding whitespace is trimmed', () => {
      expect(validate({ taskId: '  abc408_a  ', grade: TaskGrade.Q7 })).toBe(true);
    });
  });

  describe('boundary values', () => {
    test('taskId of exactly 1 character is accepted', () => {
      expect(validate({ taskId: 'a', grade: TaskGrade.Q5 })).toBe(true);
    });

    test('Q11 (first valid grade) is accepted', () => {
      expect(validate({ taskId: 'abc408_a', grade: TaskGrade.Q11 })).toBe(true);
    });

    test('D6 (last valid grade) is accepted', () => {
      expect(validate({ taskId: 'abc399_g', grade: TaskGrade.D6 })).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    test('empty taskId is rejected', () => {
      expect(validate({ taskId: '', grade: TaskGrade.Q5 })).toBe(false);
    });

    test('whitespace-only taskId is rejected after trimming', () => {
      expect(validate({ taskId: '   ', grade: TaskGrade.Q5 })).toBe(false);
    });

    test('PENDING grade is rejected', () => {
      expect(validate({ taskId: 'abc408_a', grade: TaskGrade.PENDING })).toBe(false);
    });

    test('unknown grade string is rejected', () => {
      expect(validate({ taskId: 'abc408_a', grade: 'INVALID' })).toBe(false);
    });

    test('missing grade is rejected', () => {
      expect(validate({ taskId: 'abc408_a', grade: undefined })).toBe(false);
    });

    test('missing taskId is rejected', () => {
      expect(validate({ taskId: undefined, grade: TaskGrade.Q5 })).toBe(false);
    });

    test('null taskId is rejected', () => {
      expect(validate({ taskId: null, grade: TaskGrade.Q5 })).toBe(false);
    });

    test('null grade is rejected', () => {
      expect(validate({ taskId: 'abc408_a', grade: null })).toBe(false);
    });
  });
});
