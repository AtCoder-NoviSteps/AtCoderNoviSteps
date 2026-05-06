import type { Tasks } from '$lib/types/task';
import type { Tags } from '$lib/types/tag';

import * as tagService from '$lib/services/tags';
import * as taskTagService from '$lib/services/task_tags';

import { validateAdminAccess } from '$features/auth/services/admin_access';

export async function load({ locals, params, url }) {
  await validateAdminAccess(locals, url);

  const tasks: Tasks = await taskTagService.getTasks(params.tag_id as string);
  const tags: Tags = await tagService.getTag(params.tag_id as string);

  return {
    tasks: tasks,
    tag: tags[0],
  };
}
