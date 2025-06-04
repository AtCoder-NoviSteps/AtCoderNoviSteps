import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';
import { type WorkbookList } from '$lib/types/workbook';

// 管理者 + ユーザ向けに公開されている場合
export function canViewWorkBook(role: Roles, isPublished: boolean) {
  return isAdmin(role) || isPublished;
}

/**
 * Gets the URL slug for a workbook, falling back to the workbook ID if no slug is available.
 *
 * @param workbook - The workbook object containing urlSlug and id properties
 * @returns The URL slug if available, otherwise the workbook ID as a string
 */
export function getUrlSlugFrom(workbook: WorkbookList): string {
  const slug = workbook.urlSlug;

  return slug ? slug : workbook.id.toString();
}
