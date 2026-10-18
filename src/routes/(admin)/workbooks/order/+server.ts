import { json, type RequestEvent } from '@sveltejs/kit';

import { validateAndUpdatePlacements } from '#features/workbooks/services/workbook_placements/crud.js';

import { updatePlacementsSchema } from '#features/workbooks/zod/schema.js';

import { validateAdminAccessForApi } from '#features/auth/services/admin_access.js';

import { BAD_REQUEST } from '#lib/constants/http-response-status-codes.js';

export async function POST({ request, locals }: RequestEvent) {
  await validateAdminAccessForApi(locals);

  const body = await request.json();
  const parsed = updatePlacementsSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid request body' }, { status: BAD_REQUEST });
  }

  const validationError = await validateAndUpdatePlacements(parsed.data.updates);

  if (validationError) {
    return json(validationError, { status: BAD_REQUEST });
  }

  return json({ success: true });
}
