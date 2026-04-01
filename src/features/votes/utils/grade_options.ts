import { taskGradeValues, TaskGrade } from '$lib/types/task';

/** All grade values except PENDING, used for vote buttons and distribution display. */
export const nonPendingGrades = taskGradeValues.filter((grade) => grade !== TaskGrade.PENDING);

/** Q-tier grades (11Q–1Q), used for the first row of vote buttons. */
export const qGrades = nonPendingGrades.filter((grade) => grade.startsWith('Q'));

/** D-tier grades (1D–6D), used for the second row of vote buttons. */
export const dGrades = nonPendingGrades.filter((grade) => grade.startsWith('D'));
