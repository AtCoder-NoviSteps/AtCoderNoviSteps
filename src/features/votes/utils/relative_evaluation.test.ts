import { describe, it, expect } from 'vitest';
import { TaskGrade } from '$lib/types/task';
import { calcGradeDiff, getRelativeEvaluationLabel } from './relative_evaluation';

describe('calcGradeDiff', () => {
  it('returns 0 when official and median are the same grade', () => {
    expect(calcGradeDiff(TaskGrade.Q5, TaskGrade.Q5)).toBe(0);
  });

  it('returns positive when median is harder than official', () => {
    // Q5(order 7) vs D1(order 12): diff = 12 - 7 = 5
    expect(calcGradeDiff(TaskGrade.Q5, TaskGrade.D1)).toBeGreaterThan(0);
  });

  it('returns negative when median is easier than official', () => {
    // D1(order 12) vs Q5(order 7): diff = 7 - 12 = -5
    expect(calcGradeDiff(TaskGrade.D1, TaskGrade.Q5)).toBeLessThan(0);
  });

  it('returns 1 for adjacent grade upward (Q3 -> Q2)', () => {
    expect(calcGradeDiff(TaskGrade.Q3, TaskGrade.Q2)).toBe(1);
  });

  it('returns -1 for adjacent grade downward (Q2 -> Q3)', () => {
    expect(calcGradeDiff(TaskGrade.Q2, TaskGrade.Q3)).toBe(-1);
  });

  it('returns 2 for two-step grade upward (Q3 -> Q1)', () => {
    expect(calcGradeDiff(TaskGrade.Q3, TaskGrade.Q1)).toBe(2);
  });

  it('handles boundary grades Q11 and D6', () => {
    // D6(17) - Q11(1) = 16
    expect(calcGradeDiff(TaskGrade.Q11, TaskGrade.D6)).toBe(16);
    // Q11(1) - D6(17) = -16
    expect(calcGradeDiff(TaskGrade.D6, TaskGrade.Q11)).toBe(-16);
  });

  describe('D-tier grades', () => {
    it('returns 0 when both are the same D grade', () => {
      expect(calcGradeDiff(TaskGrade.D3, TaskGrade.D3)).toBe(0);
    });

    it('returns -1 for adjacent D grade downward (D3 -> D2)', () => {
      expect(calcGradeDiff(TaskGrade.D3, TaskGrade.D2)).toBe(-1);
    });

    it('returns 1 for adjacent D grade upward (D2 -> D3)', () => {
      expect(calcGradeDiff(TaskGrade.D2, TaskGrade.D3)).toBe(1);
    });

    it('returns -2 for two-step D grade downward (D4 -> D2)', () => {
      expect(calcGradeDiff(TaskGrade.D4, TaskGrade.D2)).toBe(-2);
    });

    it('returns 2 for two-step D grade upward (D2 -> D4)', () => {
      expect(calcGradeDiff(TaskGrade.D2, TaskGrade.D4)).toBe(2);
    });
  });

  describe('Q1/D1 boundary', () => {
    it('returns 1 when median crosses from Q1 to D1 (adjacent upward)', () => {
      expect(calcGradeDiff(TaskGrade.Q1, TaskGrade.D1)).toBe(1);
    });

    it('returns -1 when median crosses from D1 to Q1 (adjacent downward)', () => {
      expect(calcGradeDiff(TaskGrade.D1, TaskGrade.Q1)).toBe(-1);
    });
  });
});

describe('getRelativeEvaluationLabel', () => {
  it('returns "++" for diff >= 2', () => {
    expect(getRelativeEvaluationLabel(2)).toBe('++');
    expect(getRelativeEvaluationLabel(5)).toBe('++');
    expect(getRelativeEvaluationLabel(16)).toBe('++');
  });

  it('returns "+" for diff === 1', () => {
    expect(getRelativeEvaluationLabel(1)).toBe('+');
  });

  it('returns "" for diff === 0', () => {
    expect(getRelativeEvaluationLabel(0)).toBe('');
  });

  it('returns "-" for diff === -1', () => {
    expect(getRelativeEvaluationLabel(-1)).toBe('-');
  });

  it('returns "--" for diff <= -2', () => {
    expect(getRelativeEvaluationLabel(-2)).toBe('--');
    expect(getRelativeEvaluationLabel(-5)).toBe('--');
    expect(getRelativeEvaluationLabel(-16)).toBe('--');
  });
});
