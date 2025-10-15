import { Prisma } from '@prisma/client';

import { default as db } from '$lib/server/database';

import type {
  ContestTaskPair,
  ContestTaskPairs,
  ContestTaskPairCreate,
  ContestTaskPairUpdate,
} from '$lib/types/contest_task_pair';

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
 * @param params - The parameters for creating a ContestTaskPair.
 *
 * @returns The created ContestTaskPair object or the existing one if it already exists.
 *
 * @throws Will throw an error if the creation fails.
 */
export async function createContestTaskPair(
  params: ContestTaskPairCreate,
): Promise<ContestTaskPair> {
  const { contestId, taskTableIndex, taskId } = params;

  try {
    const contestTaskPair = await db.contestTaskPair.create({
      data: {
        contestId,
        taskTableIndex,
        taskId,
      },
    });

    console.log('Created ContestTaskPair:', contestTaskPair);

    return contestTaskPair;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.log(`ContestTaskPair already exists: contestId=${contestId}, taskId=${taskId}`);
      const existingPair = await getContestTaskPair(contestId, taskId);

      if (!existingPair) {
        throw new Error('Unexpected: record exists but cannot be fetched');
      }

      return existingPair;
    }

    console.error('Failed to create ContestTaskPair:', error);
    throw error;
  }
}

/**
 * Updates an existing ContestTaskPair record in the database.
 *
 * @param params - The parameters for updating a ContestTaskPair.
 *
 * @returns The updated ContestTaskPair object.
 *
 * @throws Will throw an error if the update fails or if the record does not exist.
 */
export async function updateContestTaskPair(
  params: ContestTaskPairUpdate,
): Promise<ContestTaskPair> {
  const { contestId, taskTableIndex, taskId } = params;

  try {
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

    return updatedContestTaskPair;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const errorMessage = `Not found ContestTaskPair: contestId=${contestId}, taskId=${taskId}`;
      console.error(errorMessage);
      throw new Error(errorMessage, { cause: error as Error });
    }

    console.error('Failed to update ContestTaskPair:', error);
    throw error;
  }
}
