import * as workBooksCrud from '$lib/services/workbooks';
import * as userCrud from '$lib/services/users';
import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
export async function load() {
  const workbooks = await workBooksCrud.getWorkBooks();

  const workbooksWithAuthors = await Promise.all(
    workbooks.map(async (workbook) => {
      const workbookAuthor = await userCrud.getUserById(workbook.authorId);

      if (workbookAuthor) {
        return { ...workbook, authorName: workbookAuthor.username };
      } else {
        // ユーザが問題集を作成したあとに、アカウントを削除した場合
        return { ...workbook, authorName: 'unknown' };
      }
    }),
  );

  return { workbooks: workbooksWithAuthors };
}

export const actions = {
  delete: async ({ url }) => {
    console.log('form -> actions -> delete');
    const slug = Number(url.searchParams.get('slug'));

    try {
      await workBooksCrud.deleteWorkBook(slug);
    } catch (error) {
      fail(BAD_REQUEST);
    }
  },
};
