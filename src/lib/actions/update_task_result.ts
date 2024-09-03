import { fail } from '@sveltejs/kit';

import * as crud from '$lib/services/task_results';
import { BAD_REQUEST, UNAUTHORIZED } from '$lib/constants/http-response-status-codes';

// HACK: clickを1回実行するとactionsが2回実行されてしまう。原因と修正方法が分かっていない状態。
export const updateTaskResult = async (
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

  try {
    const taskId = response.get('taskId') as string;
    const submissionStatus = response.get('submissionStatus') as string;

    await crud.updateTaskResult(taskId, submissionStatus, userId);
  } catch (error) {
    console.error('Failed to update task result: ', error);
    return fail(BAD_REQUEST);
  }
};
