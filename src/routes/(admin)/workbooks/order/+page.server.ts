import { type Actions } from '@sveltejs/kit';

import {
  getWorkbooksWithPlacements,
  createInitialPlacements,
} from '$features/workbooks/services/workbook_placements/crud';

import { validateAdminAccess } from '$features/auth/services/admin_access';

export async function load({ locals, url }) {
  await validateAdminAccess(locals, url);

  const workbooks = await getWorkbooksWithPlacements();
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
