import { default as db } from '$lib/server/database';
import { classifyContest } from '$lib/utils/contest';
import type { TaskGrade } from '$lib/types/task';
import type { Task, Tasks } from '$lib/types/task';

// See:
// https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
export async function getTasks(): Promise<Task[]> {
  const tasks = await db.task.findMany({ orderBy: { task_id: 'desc' } });

  return tasks;
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
