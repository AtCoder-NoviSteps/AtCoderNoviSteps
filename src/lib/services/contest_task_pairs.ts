import { default as db } from '$lib/server/database';

import type { ContestTaskPair, ContestTaskPairs } from '$lib/types/contest_task_pair';

/**
 * Retrieves all ContestTaskPair records from the database.
 *
 * @returns An array of ContestTaskPair objects.
 */
export async function getContestTaskPairs(): Promise<ContestTaskPairs> {
  return await db.contestTaskPair.findMany();
}

/**
 * Retrieves a ContestTaskPair record by contestId and taskId.
 *
 * @param contestId: The ID of the contest.
 * @param taskId: The ID of the task.
 *
 * @returns The ContestTaskPair if found, otherwise null.
 */
export async function getContestTaskPair(
  contestId: string,
  taskId: string,
): Promise<ContestTaskPair | null> {
  return await db.contestTaskPair.findUnique({
    where: {
      contestId_taskId: {
        contestId,
        taskId,
      },
    },
  });
}

/**
 * Creates a new ContestTaskPair record in the database.
 *
 * @param contestId - The ID of the contest.
 * @param taskTableIndex - The table index of the task.
 * @param taskId - The ID of the task.
 *
 * @throws Will throw an error if the creation fails.
 */
export async function createContestTaskPair(
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): Promise<void> {
  try {
    const existingRecord = await getContestTaskPair(contestId, taskId);

    if (existingRecord) {
      console.log(`ContestTaskPair already exists: contestId=${contestId}, taskId=${taskId}`);
      return;
    }

    const contestTaskPair = await db.contestTaskPair.create({
      data: {
        contestId,
        taskTableIndex,
        taskId,
      },
    });

    console.log('Created ContestTaskPair:', contestTaskPair);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
      console.log(`Found ContestTaskPair (race): contestId=${contestId}, taskId=${taskId}`);
      return;
    }

    console.error('Failed to create ContestTaskPair:', error);
    throw error;
  }
}

/**
 * Updates an existing ContestTaskPair record in the database.
 *
 * @param contestId: The ID of the contest.
 * @param taskTableIndex: The table index of the task.
 * @param taskId: The ID of the task.
 *
 * @throws Will throw an error if the update fails or if the record does not exist.
 */
export async function updateContestTaskPair(
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): Promise<void> {
  try {
    const existingRecord = await getContestTaskPair(contestId, taskId);

    if (!existingRecord) {
      const errorMessage = `Not found ContestTaskPair: contestId=${contestId}, taskId=${taskId}`;
      console.log(errorMessage);
      throw new Error(errorMessage);
    }

    const updatedContestTaskPair = await db.contestTaskPair.update({
      where: {
        contestId_taskId: {
          contestId,
          taskId,
        },
      },
      data: {
        taskTableIndex,
      },
    });

    console.log('Updated ContestTaskPair:', updatedContestTaskPair);
  } catch (error) {
    console.error('Failed to update ContestTaskPair:', error);
    throw error;
  }
}
