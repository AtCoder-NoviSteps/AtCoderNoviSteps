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

/**
 * Returns a Japanese tooltip string explaining the relative evaluation label.
 *
 * @param label - The label returned by {@link getRelativeEvaluationLabel}.
 * @returns A human-readable explanation, or `''` when label is empty.
 */
export function getRelativeEvaluationTooltipText(label: string): string {
  switch (label) {
    case '++':
      return 'ユーザは「難しい」と評価';
    case '+':
      return 'ユーザは「やや難しい」と評価';
    case '-':
      return 'ユーザは「やや易しい」と評価';
    case '--':
      return 'ユーザは「易しい」と評価';
    default:
      return '';
  }
}

/**
 * Maps a grade difference to a Japanese label for display in the vote dropdown.
 * Returns an empty string when the diff falls outside the expected ±2 range.
 *
 * | diff | label        |
 * | ---- | ------------ |
 * | ≤ −3 | `''`         |
 * | −2   | `易しい`     |
 * | −1   | `やや易しい` |
 * |  0   | `ふつう`     |
 * | +1   | `やや難しい` |
 * | +2   | `難しい`     |
 * | ≥ +3 | `''`         |
 *
 * @param diff - A grade difference (e.g., from {@link calcGradeDiff}).
 * @returns The Japanese label string, or `''` if out of expected range.
 */
export function getRelativeEvaluationJapaneseLabel(diff: number): string {
  switch (diff) {
    case -2:
      return '易しい';
    case -1:
      return 'やや易しい';
    case 0:
      return 'ふつう';
    case 1:
      return 'やや難しい';
    case 2:
      return '難しい';
    default:
      return '';
  }
}

/**
 * Returns Tailwind text color classes for a diff value in the vote dropdown.
 * Negative diff (easier) → sky, zero → gray, positive (harder) → orange.
 *
 * @param diff - The result of {@link calcGradeDiff}.
 */
export function getRelativeEvaluationColorClass(diff: number): string {
  if (diff < 0) {
    return 'text-sky-500 dark:text-sky-400';
  }
  if (diff === 0) {
    return 'text-gray-400 dark:text-gray-500';
  }
  return 'text-orange-400 dark:text-orange-300';
}

/**
 * Returns Tailwind background + text color classes for the relative evaluation badge.
 * Negative diff (easier) → sky, positive (harder) → orange.
 * Returns empty string for diff === 0 (badge is not shown).
 *
 * @param diff - The result of {@link calcGradeDiff}.
 */
export function getRelativeEvaluationBadgeColorClass(diff: number): string {
  if (diff < 0) {
    return 'bg-sky-400 text-white dark:bg-sky-500 dark:text-white';
  }
  if (diff > 0) {
    return 'bg-orange-400 text-white dark:bg-orange-500 dark:text-white';
  }
  return '';
}
