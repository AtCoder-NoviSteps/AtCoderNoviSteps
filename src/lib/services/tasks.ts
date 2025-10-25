import { default as db } from '$lib/server/database';

import { getContestTaskPairs } from '$lib/services/contest_task_pairs';

import { ContestType } from '$lib/types/contest';
import type { Task, TaskGrade } from '$lib/types/task';
import type {
  ContestTaskPair,
  ContestTaskPairKey,
  TaskMapByContestTaskPair,
} from '$lib/types/contest_task_pair';

import { classifyContest } from '$lib/utils/contest';
import { createContestTaskPairKey } from '$lib/utils/contest_task_pair';

// See:
// https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
export async function getTasks(): Promise<Task[]> {
  const tasks = await db.task.findMany({ orderBy: { task_id: 'desc' } });

  return tasks;
}

/**
 * Fetches and merges tasks based on contest-task pairs.
 *
 * @returns A promise that resolves to a map of merged tasks keyed by contest-task pair.
 *
 * @note This function merges tasks with the same task_id but different contest_id
 *       from the contest-task pairs table. It enriches existing tasks with
 *       contest-specific information (contest_type, task_table_index, etc.).
 * @note Time Complexity: O(N + M)
 *       - N: number of tasks from the database
 *       - M: number of contest-task pairs
 *       - Map operations (has, get, set) are O(1)
 * @example
 *       const mergedTasksMap = await getMergedTasksMap();
 *       const task = mergedTasksMap.get(createContestTaskPairKey('tessoku-book', 'typical90_s'));
 */
export async function getMergedTasksMap(): Promise<TaskMapByContestTaskPair> {
  const tasks = await getTasks();
  const contestTaskPairs = await getContestTaskPairs();

  const baseTaskMap = new Map<ContestTaskPairKey, Task>(
    tasks.map((task) => [createContestTaskPairKey(task.contest_id, task.task_id), task]),
  );
  // Unique task_id in database
  const taskMap = new Map(tasks.map((task) => [task.task_id, task]));

  // Filter task(s) only the same task_id but different contest_id
  const additionalTaskMap = contestTaskPairs
    .filter((pair) => !baseTaskMap.has(createContestTaskPairKey(pair.contestId, pair.taskId)))
    .flatMap((pair) => {
      const task = taskMap.get(pair.taskId);
      const contestType = classifyContest(pair.contestId);

      if (!task || !contestType || !pair.taskTableIndex) {
        return [];
      }

      return [createMergedTask(task, pair, contestType)];
    });

  return new Map([...baseTaskMap, ...additionalTaskMap]);
}

/**
 * Creates a merged task from the original task and contest-task pair.
 *
 * @param task The original task to be enriched with contest-specific information.
 * @param pair The contest-task pair containing contestId, taskTableIndex and taskId.
 * @param contestType The type of contest (e.g., ABC, ARC) derived from contest_id.
 * @returns A tuple [key, mergedTask] where:
 *          - key: the unique identifier for the contestId:taskId pair
 *          - mergedTask: the task with contest-specific fields updated
 */
function createMergedTask(
  task: Task,
  pair: ContestTaskPair,
  contestType: ContestType,
): [ContestTaskPairKey, Task] {
  const key = createContestTaskPairKey(pair.contestId, pair.taskId);

  const mergedTask: Task = {
    ...task,
    contest_type: contestType,
    contest_id: pair.contestId,
    task_table_index: pair.taskTableIndex,
    title: task.title.replace(task.task_table_index, pair.taskTableIndex),
  };

  return [key, mergedTask];
}

/**
 * Fetches tasks with the specified task IDs.
 * @param selectedTaskIds - An array of task IDs to filter the tasks.
 *
 * @returns A promise that resolves to an array of Task objects.
 * @note conditions: { task_id: { in: taskIds } } for efficient filtering
 */
export async function getTasksWithSelectedTaskIds(
  selectedTaskIds: string[],
): Promise<Pick<Task, 'contest_id' | 'task_table_index' | 'task_id' | 'title' | 'grade'>[]> {
  if (!selectedTaskIds?.length) {
    return [];
  }

  const ids = Array.from(new Set(selectedTaskIds));

  return await db.task.findMany({
    where: {
      task_id: { in: ids }, // SQL: WHERE task_id IN ('id1', 'id2', ...)
    },
    select: {
      contest_id: true,
      task_table_index: true,
      task_id: true,
      title: true,
      grade: true,
    },
  });
}

export async function getTasksByTaskId(): Promise<Map<string, Task>> {
  const tasks = await db.task.findMany();
  const tasksMap = new Map();

  (await tasks).map((task) => {
    tasksMap.set(task.task_id, task);
  });

  return tasksMap;
}

export async function getTask(task_id: string): Promise<Task[]> {
  //本当はfindUniqueで取得したいがうまくいかない
  const task = await db.task.findMany({
    where: {
      task_id: task_id,
    },
  });

  return task;
}

export async function isExistsTask(task_id: string) {
  const registeredTask = await getTask(task_id);

  return registeredTask.length >= 1;
}

export async function createTask(
  id: string,
  task_id: string,
  contest_id: string,
  task_table_index: string,
  title: string,
) {
  const registeredTask = await isExistsTask(task_id);
  const contest_type = classifyContest(contest_id);

  if (registeredTask || contest_type === null) {
    return;
  }

  const task = await db.task.create({
    data: {
      id: id,
      task_id: task_id,
      contest_id: contest_id,
      contest_type: contest_type,
      task_table_index: task_table_index,
      title: title,
    },
  });

  console.log(task);
}

export async function updateTask(task_id: string, task_grade: TaskGrade) {
  const task = await db.task.update({
    where: { task_id: task_id },
    data: {
      grade: task_grade,
    },
  });

  console.log(task);
}

// TODO: deleteTask()

// Note:
// Uncomment only when executing the following commands directly from the script.
//
// pnpm dlx vite-node ./prisma/tasks.ts
//
//
// async function main() {
//   const tasks = getTasks();
//   console.log(tasks);

//   const task_id = 'abc322_e';
//   const task = getTask(task_id);
//   console.log(task);

//   // updateTask(task_id, TaskGrade.Q1);
//   // console.log(task);
// }

// main()
//   .catch(async (e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await db.$disconnect();
//   });
