import { redirect } from '@sveltejs/kit';

//import type { Roles } from '$lib/types/user';
import type { Task } from '$lib/types/task';
import * as taskService from '$lib/services/tasks';
import * as userService from '$lib/services/users';
//import * as tagService from '$lib/services/tags';
import { Roles } from '$lib/types/user';
import type { ImportTaskTag } from '$lib/types/tasktag';
import type { Tag } from '$lib/types/tag';
import * as taskTagsApiService from '$lib/services/tasktagsApiService';
import * as taskTagsService from '$lib/services/task_tags';

export async function load({ locals, params }) {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    redirect(302, '/login');
  }
  const task: Task[] = await taskService.getTask(params.task_id as string);

  //console.log(task);
  //console.log(user.role);
  //console.log(session?.user.role);

  //jsonデータから必要なTask情報を取り出す。
  const importTagsJson = await taskTagsApiService.getTaskTags();
  const taskTagsJson = importTagsJson[0].data.filter(
    (taskTag: ImportTaskTag) => taskTag.task_id === params.task_id,
  );
  const taskTags = await taskTagsService.getTags(params.task_id);

  const tagMap = new Map();

  taskTags.map(async (tag: Tag) => {
    tagMap.set(tag.name, tag);
    //console.log(tag.name, tag)
  });

  //console.log(taskTags)

  if (taskTagsJson.length > 0) {
    const importTags: string[] = taskTagsJson[0].tags;

    for (let i = 0; i < importTags.length; i++) {
      if (!tagMap.has(importTags[i])) {
        const tmpTag = {
          id: 'undefined',
          name: importTags[i],
          is_published: false,
          is_official: false,
        } as Tag;
        tagMap.set(importTags[i], tmpTag);
      }
    }
    //console.log(importTags)
  }

  //console.log(tagMap)
  //console.log(tagMap.values())

  return {
    task: task[0],
    tags: Array.from(tagMap.values()),
    isAdmin: user?.role !== Roles.ADMIN,
  };
}
