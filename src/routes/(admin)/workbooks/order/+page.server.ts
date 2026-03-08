import { redirect, type Actions } from '@sveltejs/kit';

import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';
import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

import prisma from '$lib/server/database';
import * as userService from '$lib/services/users';
import {
  initializeCurriculumPlacements,
  initializeSolutionPlacements,
} from '$features/workbooks/services/workbook_placements';
import type { Task } from '$lib/types/task';

async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session.user.username);

  if (!user || !isAdmin(user.role as Roles)) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }
}

export async function load({ locals }) {
  await validateAdminAccess(locals);

  const workbooks = await prisma.workBook.findMany({
    where: { workBookType: { in: ['CURRICULUM', 'SOLUTION'] } },
    include: {
      placement: true,
      workBookTasks: { select: { taskId: true } },
    },
    orderBy: { id: 'asc' },
  });

  const hasUnplacedWorkbooks = workbooks.some((workbook) => !workbook.placement);

  return { workbooks, hasUnplacedWorkbooks };
}

export const actions: Actions = {
  initializePlacements: async ({ locals }) => {
    await validateAdminAccess(locals);

    // TODO: Move to service layer.
    const unplacedCurriculum = await prisma.workBook.findMany({
      where: { workBookType: 'CURRICULUM', placement: null },
      include: {
        workBookTasks: {
          include: { task: { select: { task_id: true, grade: true } } },
        },
      },
      orderBy: { id: 'asc' },
    });

    const unplacedSolution = await prisma.workBook.findMany({
      where: { workBookType: 'SOLUTION', placement: null },
      orderBy: { id: 'asc' },
    });

    if (unplacedCurriculum.length === 0 && unplacedSolution.length === 0) {
      return { success: true };
    }

    // CURRICULUM: Assign initial grade placement based on the mode grade of tasks
    const tasksByTaskId = new Map<string, Task>();

    for (const wb of unplacedCurriculum) {
      for (const wbt of wb.workBookTasks) {
        if (wbt.task) {
          tasksByTaskId.set(wbt.task.task_id, {
            task_id: wbt.task.task_id,
            contest_id: '',
            task_table_index: '',
            title: '',
            grade: wbt.task.grade,
          });
        }
      }
    }

    const curriculumWorkbooksForInit = unplacedCurriculum.map((wb) => ({
      id: wb.id,
      workBookTasks: wb.workBookTasks.map((t) => ({
        taskId: t.task?.task_id ?? '',
        priority: 0,
        comment: '',
      })),
    }));

    const curriculumPlacements = initializeCurriculumPlacements(
      curriculumWorkbooksForInit,
      tasksByTaskId,
    );
    const solutionPlacements = initializeSolutionPlacements(unplacedSolution);

    await prisma.workBookPlacement.createMany({
      data: [...curriculumPlacements, ...solutionPlacements],
    });

    return { success: true };
  },
};
