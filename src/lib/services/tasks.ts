import { default as db } from '$lib/server/database';
import type { TaskGrade } from '$lib/types/task';
import type { Task } from '$lib/types/task';
import * as answerCrud from '$lib/services/answers';

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

export async function createTask(
  id: string,
  task_id: string,
  contest_id: string,
  task_table_index: string,
  title: string,
) {
  const task = await db.task.create({
    data: {
      id: id,
      task_id: task_id,
      contest_id: contest_id,
      //contest_type: contest_type,
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

export async function extractUnansweredTasks(userId: string): Promise<Map<string, Task>> {
  const tasks = await getTasks();
  const answers = await answerCrud.getAnswers(userId);
  const unansweredTasksMap: Map<string, Task> = new Map();

  // HACK: 一度回答し、その後で「No Sub」に変更した場合を考慮する必要があるか?
  // 現状では、上記の操作を許容していないはず
  tasks.map((task: Task) => {
    const taskId = task.task_id;

    if (!answers.has(taskId)) {
      unansweredTasksMap.set(taskId, task);
    }
  });

  return unansweredTasksMap;
}

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
