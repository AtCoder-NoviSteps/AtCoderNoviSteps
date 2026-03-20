import { default as db } from '$lib/server/database';
import * as vote_crud from '$features/votes/services/absolute_votes';

export async function updateAbsoluteVoteResult(taskId: string, grade: string, userId: string) {
  await db.$transaction(async () => {
    await vote_crud.upsertVoteGrade(taskId, userId, grade);
  });
}