import type { TaskGrade } from '$lib/types/task';
import { getGradeOrder } from '$lib/utils/task';

/**
 * Computes the difference in grade order between the median vote and the official grade.
 * Positive means users consider the problem harder than the official grade; negative means easier.
 *
 * @param officialGrade - The officially confirmed grade stored in the DB.
 * @param medianGrade - The median grade derived from user votes.
 * @returns `gradeOrder(medianGrade) - gradeOrder(officialGrade)`
 */
export function calcGradeDiff(officialGrade: TaskGrade, medianGrade: TaskGrade): number {
  return getGradeOrder(medianGrade) - getGradeOrder(officialGrade);
}

/**
 * Converts a grade difference to a 5-level relative evaluation label.
 *
 * | diff   | label |
 * | ------ | ----- |
 * | ≤ −2   | `--`  |
 * | −1     | `-`   |
 * |  0     | `""`  |
 * | +1     | `+`   |
 * | ≥ +2   | `++`  |
 *
 * @param diff - The result of {@link calcGradeDiff}.
 * @returns The display label string.
 */
export function getRelativeEvaluationLabel(diff: number): string {
  if (diff <= -2) {
    return '--';
  }
  if (diff === -1) {
    return '-';
  }
  if (diff === 0) {
    return '';
  }
  if (diff === 1) {
    return '+';
  }
  return '++';
}
