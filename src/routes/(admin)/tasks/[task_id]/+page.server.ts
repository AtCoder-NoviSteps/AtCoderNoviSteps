import { fail, type Actions } from '@sveltejs/kit';

import { type Tasks, type TaskGrade, getTaskGrade } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';
import type { ImportTaskTag } from '$lib/types/tasktag';

import * as taskService from '$lib/services/tasks';
import * as taskTagsApiService from '$lib/services/tasktagsApiService';
import * as taskTagsService from '$lib/services/task_tags';

import { validateAdminAccess } from '$features/auth/services/admin_access';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '$lib/constants/http-response-status-codes';

export async function load({ locals, params, url }) {
  await validateAdminAccess(locals, url);

  const task: Tasks = await taskService.getTask(params.task_id as string);

  const importTagsJson = await taskTagsApiService.getTaskTags();
  const taskTagsJson = importTagsJson[0].data.filter(
    (taskTag: ImportTaskTag) => taskTag.task_id === params.task_id,
  );
  const taskTags = await taskTagsService.getTags(params.task_id);

  const tagMap = new Map();

  taskTags.map(async (tag: Tag) => {
    tagMap.set(tag.name, tag);
  });

  if (taskTagsJson.length > 0) {
    const importTags: string[] = taskTagsJson[0].tags;

    for (let i = 0; i < importTags.length; i++) {
      if (!tagMap.has(importTags[i])) {
        const tmpTag = {
          id: `temp_${importTags[i]}`, // Note: temp_ prefix = not yet in DB; used to distinguish from existing tags in the UI
          name: importTags[i],
          is_published: false,
          is_official: false,
        } as Tag;
        tagMap.set(importTags[i], tmpTag);
      }
    }
  }

  return {
    task: task[0],
    tags: Array.from(tagMap.values()),
  };
}

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    await validateAdminAccess(locals);

    const formData = await request.formData();
    const taskGradeStr = formData.get('task_grade')?.toString() ?? '';

    if (taskGradeStr === '') {
      return { success: true };
    }

    const task_grade: TaskGrade | undefined = getTaskGrade(taskGradeStr);

    if (task_grade === undefined) {
      return fail(BAD_REQUEST, { success: false });
    }

    const updateResult = await taskService.updateTask(params.task_id, task_grade);

    if (updateResult === null) {
      return fail(INTERNAL_SERVER_ERROR, { success: false });
    }

    return { success: true };
  },
};
