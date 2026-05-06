import { redirect, type Actions } from '@sveltejs/kit';

import type { Tag } from '$lib/types/tag';

import * as tagService from '$lib/services/tags';

import { validateAdminAccess } from '$features/auth/services/admin_access';

export async function load({ locals, url }) {
  await validateAdminAccess(locals, url);

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

    redirect(301, '/tags/');
  },
};
