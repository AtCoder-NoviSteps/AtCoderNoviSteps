import { redirect, type Actions } from '@sveltejs/kit';

import type { Tag } from '$lib/types/tag';

import * as tagService from '$lib/services/tags';
import * as userService from '$lib/services/users';

//import { sha256 } from '$lib/utils/hash';

import { Roles } from '$lib/types/user';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }

  const tags = await tagService.getTags();

  const retTags = tags.map((tag: Tag) => {
    return {
      id: tag.id,
      name: tag.name,
      is_published: tag.is_published,
      is_official: tag.is_official,
    };
  });

  return {
    tags: retTags,
  };
}

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      console.log('tags->actions->create');
      const formData = await request.formData();
      console.log(formData);
      const tag_id = formData.get('tag_id')?.toString() as string;

      console.log(tag_id);
    } catch {
      return {
        success: false,
      };
    }

    return {
      success: true,
    };
  },

  update: async ({ request }) => {
    try {
      console.log('tags->actions->update');
      const formData = await request.formData();
      console.log(formData);
      const tag_id = formData.get('tag_id')?.toString();

      //POSTされてこなかった場合は抜ける
      if (tag_id === '') {
        return {
          success: true,
        };
      }
    } catch {
      return {
        success: false,
      };
    }

    throw redirect(301, '/tags/');
  },
};
