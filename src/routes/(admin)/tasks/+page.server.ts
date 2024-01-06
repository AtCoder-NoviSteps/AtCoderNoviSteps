import { redirect } from '@sveltejs/kit';

//import type { Roles } from '$lib/types/user';
import type { ImportTask, Task } from '$lib/types/task';
import * as taskService from '$lib/services/tasks';
import * as userService from '$lib/services/users';
import * as problemApiService from '$lib/services/problemsApiService';
import { Roles } from '$lib/types/user';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }

  const importTasksJson = await problemApiService.getTasks();
  const tasks = await taskService.getTasks();

  const taskMap = new Map<string, Task>();

  for (let i = 0; i < tasks.length; i++) {
    taskMap.set(tasks[i].task_id, tasks[i]);
  }

  //console.log(taskMap.values.length)
  //console.log(tasks[0])
  //console.log(importTasksJson[0])

  const filteredTasks = new Array<ImportTask>();
  for (let i = 0; i < importTasksJson.length; i++) {
    if (importTasksJson[i].id === 'abc042') {
      break;
    }
    //console.log("check:", importTasksJson[i].id, taskMap.has(importTasksJson[i].id))

    if (!taskMap.has(importTasksJson[i].id)) {
      filteredTasks.push(importTasksJson[i]);
    }
  }
  const importTasks = filteredTasks.map((importTaskJson) => {
    return {
      task_id: importTaskJson.id,
      problem_index: importTaskJson.problem_index,
      contest_id: importTaskJson.contest_id,
      title: importTaskJson.title.slice(0, 20),
      task_table_index: importTaskJson.problem_index,
      grade: 'PENDING',
    };
  });

  return {
    tasks: tasks,
    importTasks: importTasks,
  };
}
