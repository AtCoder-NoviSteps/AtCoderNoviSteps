// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
// https://superforms.rocks/get-started
// https://zod.dev/?id=basic-usage
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes
// https://regex101.com/
// https://qiita.com/mpyw/items/886218e7b418dfed254b
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms/server';

import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

// TODO: 別ファイルとして切り出す
const schema = z.object({
  username: z
    .string()
    .min(5, { message: '5文字以上入力してください' })
    .max(24, { message: '24文字になるまで削除してください' })
    .regex(/^[\w]*$/, { message: '半角英数字のみを利用してください' }),
  password: z
    .string()
    .min(8, { message: '8文字以上入力してください' })
    .max(128, { message: '128文字になるまで削除してください' })
    .regex(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)[a-zA-Z\d]{8,128}$/, {
      message: '半角英文字(小・大)・数字をそれぞれ1文字以上含めてください',
    }),
});

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (session) {
    throw redirect(302, '/');
  }

  const form = await superValidate(null, schema);

  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, schema);

    if (!form.valid) {
      console.log(form);
      return fail(400, { form });
    }

    try {
      const user = await auth.createUser({
        key: {
          providerId: 'username', // auth method
          providerUserId: form.data.username.toLowerCase(), // unique id when using "username" auth method
          password: form.data.password, // hashed by Lucia
        },
        attributes: {
          username: form.data.username,
        },
      });

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });

      locals.auth.setSession(session); // set session cookie
    } catch (e) {
      // this part depends on the database you're using
      // check for unique constraint error in user table

      // TODO: 例外処理の方法を調べて実装
      // 既に登録されている場合は、ユーザ名 or パスワードを変えるようにメッセージを出す
      // return fail(400, { form });
      // if (e instanceof SomeDatabaseError && e.message === USER_TABLE_UNIQUE_CONSTRAINT_ERROR) {
      //   return fail(400, {
      //     message: 'Username already taken',
      //   });
      // }

      return fail(500, {
        message: 'サーバでエラーが発生しました',
        form: form,
      });
    }

    // redirect to
    // make sure you don't throw inside a try/catch block!
    throw redirect(302, '/');
  },
};
