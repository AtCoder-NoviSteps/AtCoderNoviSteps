import { redirect } from '@sveltejs/kit';

//import type { Roles } from '$lib/types/user';
import type { Tag } from '$lib/types/tag';
import type { Task } from '$lib/types/task';
import * as tagService from '$lib/services/tags';
import * as taskTagService from '$lib/services/task_tags';
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
  const tags: Tag[] = await tagService.getTag(params.tag_id as string);
  const tasks: Task[] = await taskTagService.getTasks(params.tag_id as string);

  console.log(tags[0]);
  console.log(user.role);
  console.log(session?.user.role);

  return {
    tag: tags[0],
    tasks: tasks,
    isAdmin: user?.role !== Roles.ADMIN,
  };
}
