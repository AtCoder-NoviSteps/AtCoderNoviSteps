import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import prisma from '$lib/server/database';
import { upsertWorkBookPlacements } from '$features/workbooks/services/workbook_placements';

import { updatePlacementsSchema } from '$features/workbooks/zod/schema';

import { validateAdminAccess } from '../../_utils/auth';

export async function POST({ request, locals }: RequestEvent) {
  await validateAdminAccess(locals);

  const body = await request.json();
  const parsed = updatePlacementsSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Server-side validation: prevent cross-type movement between CURRICULUM and SOLUTION
  for (const update of parsed.data.updates) {
    const existing = await prisma.workBookPlacement.findUnique({
      where: { id: update.id },
      include: { workBook: { select: { workBookType: true } } },
    });

    if (!existing) {
      return json({ error: `placement id=${update.id} does not exist` }, { status: 400 });
    }

    const isCurriculumToSolution =
      existing.workBook.workBookType === 'CURRICULUM' && update.solutionCategory !== null;
    const isSolutionToCurriculum =
      existing.workBook.workBookType === 'SOLUTION' && update.taskGrade !== null;

    if (isCurriculumToSolution || isSolutionToCurriculum) {
      return json(
        { error: 'Moving between CURRICULUM and SOLUTION is not allowed' },
        { status: 400 },
      );
    }
  }

  await upsertWorkBookPlacements(parsed.data.updates);

  return json({ success: true });
}
