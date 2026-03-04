import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';
import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

import prisma from '$lib/server/database';
import * as userService from '$lib/services/users';
import { upsertWorkBookPlacements } from '$features/workbooks/services/workbook_placements';
import { updatePlacementsSchema } from '$features/workbooks/zod/schema';

async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session.user.username as string);

  if (!isAdmin(user?.role as Roles)) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }
}

export async function POST({ request, locals }: RequestEvent) {
  await validateAdminAccess(locals);

  const body = await request.json();
  const parsed = updatePlacementsSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  // サーバー側バリデーション: CURRICULUM↔SOLUTION 間移動禁止
  for (const update of parsed.data.updates) {
    const existing = await prisma.workBookPlacement.findUnique({
      where: { id: update.id },
      include: { workBook: { select: { workBookType: true } } },
    });

    if (!existing) {
      return json({ error: `placement id=${update.id} が存在しません` }, { status: 400 });
    }

    const isCurriculumToSolution =
      existing.workBook.workBookType === 'CURRICULUM' && update.solutionCategory !== null;
    const isSolutionToCurriculum =
      existing.workBook.workBookType === 'SOLUTION' && update.taskGrade !== null;

    if (isCurriculumToSolution || isSolutionToCurriculum) {
      return json(
        { error: 'CURRICULUM と SOLUTION 間の移動は禁止されています' },
        { status: 400 },
      );
    }
  }

  await upsertWorkBookPlacements(parsed.data.updates);

  return json({ success: true });
};
