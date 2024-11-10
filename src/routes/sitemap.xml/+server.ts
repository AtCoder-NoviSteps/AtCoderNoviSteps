/**
 * Generates a dynamic sitemap.xml for the application
 * @description Provides search engines with a map of all publishable pages
 * @returns XML sitemap following the sitemaps.org protocol
 */

// See:
// https://github.com/jasongitmail/super-sitemap
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as sitemap from 'super-sitemap';

import * as workBooksCrud from '$lib/services/workbooks';
import { INTERNAL_SERVER_ERROR } from '$lib/constants/http-response-status-codes';

/**
 * Handles the GET request to generate a sitemap.
 *
 * This function retrieves the list of workbooks, filters out the unpublished ones,
 * and generates a sitemap response with the specified parameters.
 *
 * @returns {Promise<Response>} The sitemap response.
 *
 * @throws {Error} If there is an error while fetching the workbooks or generating the sitemap.
 */
export const GET: RequestHandler = async () => {
  let publishedWorkBookIds: string[] = [];

  try {
    const workbooks = await workBooksCrud.getWorkBooks();
    publishedWorkBookIds = workbooks
      .filter((workbook) => workbook.isPublished)
      .map((workbook) => String(workbook.id));
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error(`Failed to generate sitemap: ${errorMessage}`);

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
