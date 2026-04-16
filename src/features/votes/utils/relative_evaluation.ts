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
 * Returns a Japanese tooltip string explaining the relative evaluation label.
 *
 * @param label - The label returned by {@link getRelativeEvaluationLabel}.
 * @returns A human-readable explanation, or `''` when label is empty.
 */
export function getRelativeEvaluationTooltipText(label: string): string {
  switch (label) {
    case '++':
      return '投票中央値が公式グレードより2段階以上高い（難しい）';
    case '+':
      return '投票中央値が公式グレードより1段階高い（難しい）';
    case '-':
      return '投票中央値が公式グレードより1段階低い（易しい）';
    case '--':
      return '投票中央値が公式グレードより2段階以上低い（易しい）';
    default:
      return '';
  }
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
