// See:
// https://github.com/jasongitmail/super-sitemap
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as sitemap from 'super-sitemap';

import * as workBooksCrud from '$lib/services/workbooks';
import { INTERNAL_SERVER_ERROR } from '$lib/constants/http-response-status-codes';

export const GET: RequestHandler = async () => {
  let publishedWorkBookIds: string[] = [];

  try {
    const workbooks = await workBooksCrud.getWorkBooks();
    publishedWorkBookIds = workbooks
      .filter((workbook) => workbook.isPublished)
      .map((workbook) => String(workbook.id));

    console.log('Published workbook ids: ', publishedWorkBookIds);
  } catch (e) {
    console.error(e);
    throw error(INTERNAL_SERVER_ERROR, 'Failed to load data for param values.');
  }

  return await sitemap.response({
    origin: 'https://atcoder-novisteps.vercel.app',
    excludeRoutePatterns: [
      // For admin pages
      '.*\\(admin\\).*', // i.e. routes within a group
      '/users/.*',
      '/workbooks/create.*',
      '/workbooks/edit/.*',
      // Deprecated page
      '/problems/\\[slug\\]',
    ],
    paramValues: {
      '/problems': [
        {
          values: [''],
        },
      ],
      '/workbooks/[slug]': publishedWorkBookIds,
    },
    defaultChangefreq: 'daily',
    defaultPriority: 0.8,
    sort: 'alpha',
  });
};
