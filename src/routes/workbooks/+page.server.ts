import * as workBooksCrud from '$lib/services/workbooks';
import * as userCrud from '$lib/services/users';

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
export async function load() {
  const workbooks = await workBooksCrud.getWorkBooks();

  const workbooksWithAuthors = await Promise.all(
    workbooks.map(async (workbook) => {
      const workbookAuthor = await userCrud.getUserById(workbook.userId);

      if (workbookAuthor) {
        return { ...workbook, author: workbookAuthor.username };
      } else {
        // ユーザが問題集を作成したあとに、アカウントを削除した場合
        return { ...workbook, author: 'unknown' };
      }
    }),
  );

  return { workbooks: workbooksWithAuthors };
}
