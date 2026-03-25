import { TaskGrade } from '@prisma/client';
import { getGradeOrder, taskGradeOrderInfinity } from '$lib/utils/task';

/** Maps grade order (1=Q11 … 17=D6) back to the corresponding TaskGrade enum value. */
const ORDER_TO_TASK_GRADE: Map<number, TaskGrade> = new Map([
  [1, TaskGrade.Q11],
  [2, TaskGrade.Q10],
  [3, TaskGrade.Q9],
  [4, TaskGrade.Q8],
  [5, TaskGrade.Q7],
  [6, TaskGrade.Q6],
  [7, TaskGrade.Q5],
  [8, TaskGrade.Q4],
  [9, TaskGrade.Q3],
  [10, TaskGrade.Q2],
  [11, TaskGrade.Q1],
  [12, TaskGrade.D1],
  [13, TaskGrade.D2],
  [14, TaskGrade.D3],
  [15, TaskGrade.D4],
  [16, TaskGrade.D5],
  [17, TaskGrade.D6],
  [taskGradeOrderInfinity, TaskGrade.PENDING],
]);

type GradeCounter = { grade: TaskGrade; count: number };

/**
 * Computes the median grade from a list of grade counters.
 * Returns `null` when the total vote count is below the minimum threshold.
 *
 * @param counters - Grade counters sorted by grade ascending.
 * @param minVotes - Minimum votes required to compute a median. Defaults to 3.
 * @returns The median TaskGrade, or `null` if there are fewer than `minVotes` total votes.
 */
export function computeMedianGrade(counters: GradeCounter[], minVotes = 3): TaskGrade | null {
  const total = counters.reduce((sum, counter) => sum + counter.count, 0);
  if (total < minVotes) {
    return null;
  }

  const getGradeOrderAtPosition = (target: number): number => {
    let cumulative = 0;
    for (const counter of counters) {
      cumulative += counter.count;
      if (cumulative >= target) {
        return getGradeOrder(counter.grade);
      }
    }
    throw new RangeError(`getGradeOrderAtPosition: position ${target} is out of range (total=${total})`);
  };

  let medianOrder: number;
  if (total % 2 !== 0) {
    medianOrder = getGradeOrderAtPosition(Math.ceil(total / 2));
  } else {
    const lower = getGradeOrderAtPosition(total / 2);
    const upper = getGradeOrderAtPosition(total / 2 + 1);
    medianOrder = Math.round((lower + upper) / 2);
  }

  return ORDER_TO_TASK_GRADE.get(medianOrder) as TaskGrade;
}
