import { Roles } from '$lib/types/user';
import { isAdmin } from '$lib/utils/authorship';

// 管理者 + ユーザ向けに公開されている場合
export function canViewWorkBook(role: Roles, isPublished: boolean) {
  return isAdmin(role) || isPublished;
}
