import { error } from '@sveltejs/kit';

import type { Tasks } from '#lib/types/task.js';

import { validateAdminAccess } from '$features/auth/services/admin_access';
import * as tagService from '#lib/services/tags.js';
import * as taskTagService from '#lib/services/task_tags.js';

import { NOT_FOUND } from '#lib/constants/http-response-status-codes.js';

export async function load({ locals, params, url }) {
  await validateAdminAccess(locals, url);

  const tasks: Tasks = await taskTagService.getTasks(params.tag_id as string);
  const tag = await tagService.getTag(params.tag_id as string);

  if (!tag) {
    error(NOT_FOUND, 'Not found tag');
  }

  return {
    tasks,
    tag,
  };
}
