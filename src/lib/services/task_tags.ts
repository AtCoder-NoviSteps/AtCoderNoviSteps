import { default as db } from '$lib/server/database';
import type { Task } from '$lib/types/task';
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
