import { taskGradeValues, type TaskGrade } from '$lib/types/task';

/**
 * Type guard to validate if an unknown value is a valid TaskGrade.
 * @param value - The value to validate
 * @returns true if value is a valid TaskGrade enum member
 */
export function isValidTaskGrade(value: unknown): value is TaskGrade {
  return typeof value === 'string' && taskGradeValues.includes(value as TaskGrade);
}
