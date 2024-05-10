import { getWorkbookWithAuthor } from '$lib/utils/workbook';
import * as taskCrud from '$lib/services/tasks';

// TODO: 一般公開するまでは、管理者のみアクセスできるようにする
export async function load({ params }) {
  const workbookWithAuthor = await getWorkbookWithAuthor(params.slug);

  // FIXME: ユーザの回答状況を反映させるため、taskResultsに置き換え
  const tasks = await taskCrud.getTasksByTaskId();

  return { ...workbookWithAuthor, tasks: tasks };
}
