import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { validateAndUpdatePlacements } from '$features/workbooks/services/workbook_placements';

import { updatePlacementsSchema } from '$features/workbooks/zod/schema';

import { validateAdminAccess } from '../../_utils/auth';

import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';

export async function POST({ request, locals }: RequestEvent) {
  await validateAdminAccess(locals);

  const body = await request.json();
  const parsed = updatePlacementsSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: BAD_REQUEST });
  }

  const result = await validateAndUpdatePlacements(parsed.data.updates);

  if (result) {
    return json(result, { status: BAD_REQUEST });
  }

  return json({ success: true });
}
