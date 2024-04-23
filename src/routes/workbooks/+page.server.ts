import * as crud from '$lib/services/workbooks';

export async function load() {
  const workbooks = await crud.getWorkBooks();

  // TODO: workbookのidからユーザ名を取得できるようにする

  return { workbooks: workbooks };
}
