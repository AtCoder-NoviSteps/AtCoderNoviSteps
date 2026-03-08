import { type Actions } from '@sveltejs/kit';

import prisma from '$lib/server/database';
import { createInitialPlacements } from '$features/workbooks/services/workbook_placements';
import { validateAdminAccess } from '../../_utils/auth';

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
    await createInitialPlacements();
    return { success: true };
  },
};
