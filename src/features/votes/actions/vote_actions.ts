import { fail } from '@sveltejs/kit';
import { TaskGrade } from '@prisma/client';

import { upsertVoteGradeTables } from '$features/votes/services/vote_grade';
import { BAD_REQUEST, UNAUTHORIZED } from '$lib/constants/http-response-status-codes';

export const voteAbsoluteGrade = async ({
  request,
  locals,
}: {
  request: Request;
  locals: App.Locals;
}) => {
  const formData = await request.formData();
  const session = await locals.auth.validate();

  if (!session || !session.user || !session.user.userId) {
    return fail(UNAUTHORIZED, {
      message: 'ログインしていないか、もしくは、ログイン情報が不正です。',
    });
  }

  const userId = session.user.userId;
  const taskIdRaw = formData.get('taskId');
  const gradeRaw = formData.get('grade');

  if (
    typeof taskIdRaw !== 'string' ||
    !taskIdRaw ||
    typeof gradeRaw !== 'string' ||
    !(Object.values(TaskGrade) as string[]).includes(gradeRaw)
  ) {
    return fail(BAD_REQUEST, { message: 'Invalid request parameters.' });
  }

  const taskId = taskIdRaw;
  const grade = gradeRaw as TaskGrade;

  try {
    await upsertVoteGradeTables(userId, taskId, grade);
  } catch (error) {
    console.error('Failed to vote absolute grade: ', error);
    return fail(BAD_REQUEST, { message: 'Failed to record vote.' });
  }
};
