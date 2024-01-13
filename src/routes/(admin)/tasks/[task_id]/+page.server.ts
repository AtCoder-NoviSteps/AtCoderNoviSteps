import { redirect } from '@sveltejs/kit';

//import type { Roles } from '$lib/types/user';
import type { Task } from '$lib/types/task';
import * as taskService from '$lib/services/tasks';
import * as userService from '$lib/services/users';
import { Roles } from '$lib/types/user';

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }
  const task: Task[] = await taskService.getTask(params.task_id as string);

  console.log(task);
  console.log(user.role);
  console.log(session?.user.role);

  return {
    task: task[0],
    isAdmin: user?.role !== Roles.ADMIN,
  };
}
