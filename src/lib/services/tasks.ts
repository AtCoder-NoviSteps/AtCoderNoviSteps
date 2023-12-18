import { default as db } from '$lib/server/database';
import type { TaskGrade } from '$lib/types/task';
import type { Task } from '$lib/types/task';

// See:
// https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
export async function getTasks(): Promise<Task[]> {
  const tasks = await db.task.findMany({ orderBy: { task_id: 'desc' } });

  return tasks;
}

export async function getTask(task_id: string): Promise<Task[]> {
  //本当はfindUniqueで取得したいがうまくいかない
  const task = await db.task.findMany({
    where: {
      task_id: task_id,
    },
  });
  console.log(task);

  return task;
}

// TODO: createTask()

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
