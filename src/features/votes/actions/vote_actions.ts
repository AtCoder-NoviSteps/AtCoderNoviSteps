import { fail } from '@sveltejs/kit';

import * as crud from '@/features/votes/services/vote_crud';
import { BAD_REQUEST, UNAUTHORIZED } from '$lib/constants/http-response-status-codes';

export const voteAbsoluteGrade = async (
  { request, locals }: { request: Request; locals: App.Locals },
  operationLog: string,
) => {
  console.log(operationLog);
  const response = await request.formData();
  const session = await locals.auth.validate();

  if (!session || !session.user || !session.user.userId) {
    return fail(UNAUTHORIZED, {
      message: 'ログインしていないか、もしくは、ログイン情報が不正です。',
    });
  }

  const userId = session.user.userId;
  const taskId = response.get('taskId') as string;
  const grade = response.get('grade') as string;

  try {
    await crud.upsertVoteGradeTables(userId, taskId, grade);
  } catch (error) {
    console.error('Failed to vote absolute grade: ', error);
    return fail(BAD_REQUEST);
  }
};
