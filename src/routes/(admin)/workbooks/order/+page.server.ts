import { redirect, fail, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';

import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';
import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

import prisma from '$lib/server/database';
import * as userService from '$lib/services/users';
import {
  initializeCurriculumPlacements,
  initializeSolutionPlacements,
  upsertWorkBookPlacements,
} from '$features/workbooks/services/workbook_placements';
import { calcWorkBookGradeModes } from '$features/workbooks/utils/workbooks';
import { updatePlacementsSchema } from '$features/workbooks/zod/schema';
import type { Task } from '$lib/types/task';

async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session?.user.username as string);

  if (!isAdmin(user?.role as Roles)) {
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

  const form = await superValidate(null, zod4(updatePlacementsSchema));

  return { workbooks, hasUnplacedWorkbooks, form };
}

export const actions: Actions = {
  initializePlacements: async ({ locals }) => {
    await validateAdminAccess(locals);

    // FIXME: Move to service layer or extract method for easier understanding.
    // 未配置の workbook を type 別に取得
    const unplacedCurriculum = await prisma.workBook.findMany({
      where: { workBookType: 'CURRICULUM', placement: null },
      include: {
        workBookTasks: {
          include: { task: { select: { task_id: true, grade: true } } },
        },
      },
      orderBy: { id: 'asc' },
    });

    // TODO: Move service layer or extract method for easier understanding.
    const unplacedSolution = await prisma.workBook.findMany({
      where: { workBookType: 'SOLUTION', placement: null },
      orderBy: { id: 'asc' },
    });

    if (unplacedCurriculum.length === 0 && unplacedSolution.length === 0) {
      return { success: true };
    }

    // CURRICULUM: タスクの最頻値グレードで初期配置
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

  updatePlacements: async ({ request, locals }) => {
    await validateAdminAccess(locals);

    const form = await superValidate(request, zod4(updatePlacementsSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // サーバー側バリデーション: CURRICULUM↔SOLUTION 間移動禁止
    for (const update of form.data.updates) {
      const existing = await prisma.workBookPlacement.findUnique({
        where: { id: update.id },
        include: { workBook: { select: { workBookType: true } } },
      });

      if (!existing) {
        return fail(400, { form, error: `placement id=${update.id} が存在しません` });
      }

      const isCurriculumToSolution =
        existing.workBook.workBookType === 'CURRICULUM' && update.solutionCategory !== null;
      const isSolutionToCurriculum =
        existing.workBook.workBookType === 'SOLUTION' && update.taskGrade !== null;

      if (isCurriculumToSolution || isSolutionToCurriculum) {
        return fail(400, {
          form,
          error: 'CURRICULUM と SOLUTION 間の移動は禁止されています',
        });
      }
    }

    await upsertWorkBookPlacements(form.data.updates);

    return { form };
  },
};
