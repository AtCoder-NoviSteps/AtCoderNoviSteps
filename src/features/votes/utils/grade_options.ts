import { taskGradeValues, TaskGrade } from '$lib/types/task';

/** All grade values except PENDING, used for vote buttons and distribution display. */
export const nonPendingGrades = taskGradeValues.filter((grade) => grade !== TaskGrade.PENDING);
