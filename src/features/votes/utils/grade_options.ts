import { taskGradeValues, TaskGrade } from '$lib/types/task';

/** All grade values except PENDING, used for vote buttons and distribution display. */
export const nonPendingGrades = taskGradeValues.filter((grade) => grade !== TaskGrade.PENDING);

/** Q-tier grades (11Q–1Q), used for the first row of vote buttons. */
export const qGrades = nonPendingGrades.filter((grade) => grade.startsWith('Q'));

/** D-tier grades (1D–6D), used for the second row of vote buttons. */
export const dGrades = nonPendingGrades.filter((grade) => grade.startsWith('D'));

/**
 * Resolves the display grade for a PENDING task.
 * Returns `estimatedGrade` (median-based) when the official grade is still PENDING,
 * otherwise returns the official grade unchanged.
 * @param grade - The official task grade from the DB.
 * @param estimatedGrade - The median-based estimated grade, if available.
 * @returns The grade to display in the UI.
 */
export function resolveDisplayGrade(
  grade: TaskGrade,
  estimatedGrade?: TaskGrade | null,
): TaskGrade {
  if (grade !== TaskGrade.PENDING) {
    return grade;
  }

  return estimatedGrade ?? grade;
}
