import type { ContestTaskPair as ContestTaskPairOrigin } from '@prisma/client';

import type { TaskResult } from '$lib/types/task';

export type ContestTaskPair = ContestTaskPairOrigin;

export type ContestTaskPairs = ContestTaskPair[];

// For CRUD operation parameter types
export type ContestTaskPairRead = ContestTaskPair;

export type ContestTaskPairCreate = {
  contestId: string;
  taskTableIndex: string;
  taskId: string;
};

export type ContestTaskPairUpdate = ContestTaskPairCreate;

// For mapping and identification
export type ContestTaskPairKey = `${string}:${string}`; // "contest_id:task_id"

export type TaskResultMapByContestTaskPair = Map<ContestTaskPairKey, TaskResult>;
