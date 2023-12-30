//See https://tech-blog.rakus.co.jp/entry/20230209/sveltekit#%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E6%8A%95%E7%A8%BF%E7%94%BB%E9%9D%A2

import * as validationService from '$lib/services/validateApiService';
import type { Actions } from './$types';

import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }
  throw redirect(302, '/users/edit');
}

export const actions: Actions = {
  default: async ({ request }) => {
    console.log('users->generate->actions->default');
    const formData = await request.formData();
    console.log(formData);

    const username = formData.get('username')?.toString() as string;
    const atcoder_username = formData.get('atcoder_username')?.toString() as string;

    console.log('ここにvalidationCodeを作成してデータベースに登録するコードを書きます');
    const validationCode = await validationService.generate(username, atcoder_username);
    console.log(validationCode);

    return { success: true };
  },
};
