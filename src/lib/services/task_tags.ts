import { default as db } from '#lib/server/database.js';
import type { Task } from '#lib/types/task.js';
import type { Tag } from '#lib/types/tag.js';
// See:
// https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
export async function getTasks(tag_id: string) {
  const tasktags = await db.taskTag.findMany({
    where: {
      tag_id: tag_id,
    },
    include: {
      task: true,
    },
  });

  const tasks = tasktags.map((tasktag) => {
    return tasktag.task as Task;
  });

  return tasks;
}

export async function getTags(task_id: string) {
  const tasktags = await db.taskTag.findMany({
    where: {
      task_id: task_id,
    },
    include: {
      tag: true,
    },
  });

  const tags = tasktags.map((tasktag) => {
    return tasktag.tag as Tag;
  });

  return tags;
}
