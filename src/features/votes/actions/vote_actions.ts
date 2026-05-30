import { fail } from '@sveltejs/kit';
import type { TaskGrade } from '@prisma/client';

import { upsertVoteGradeTables } from '$features/votes/services/vote_grade';
import {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from '$lib/constants/http-response-status-codes';

import type { VoteAbsoluteGradeInput } from '$features/votes/zod/schema';

export const voteAbsoluteGrade = async ({
  locals,
  data,
}: {
  locals: App.Locals;
  data: VoteAbsoluteGradeInput;
}) => {
  const session = await locals.auth.validate();

  if (!session || !session.user || !session.user.userId) {
    return fail(UNAUTHORIZED, {
      message: 'ログインしていないか、もしくは、ログイン情報が不正です。',
    });
  }

  if (!locals.user?.is_validated) {
    return fail(FORBIDDEN, {
      message: 'AtCoderアカウントの認証が必要です。',
    });
  }

  try {
    await upsertVoteGradeTables(session.user.userId, data.taskId, data.grade as TaskGrade);
    return { success: true as const };
  } catch (error) {
    console.error('Failed to vote absolute grade: ', error);
    return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to record vote.' });
  }
};
