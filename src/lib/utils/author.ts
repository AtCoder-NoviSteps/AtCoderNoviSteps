import { Roles } from '$lib/types/user';

export const isAdmin = (role: Roles): boolean => {
  return role === Roles.ADMIN;
};

export const hasAuthority = (userId: string, authorId: string): boolean => {
  return userId.toLocaleLowerCase() === authorId.toLocaleLowerCase();
};

// Note: 公開 + 非公開(本人のみ)の問題集が閲覧できる
export const canRead = (isPublished: boolean, userId: string, authorId: string): boolean => {
  return isPublished || hasAuthority(userId, authorId);
};

// Note: 特例として、管理者はユーザが公開している問題集を編集できる
export const canEdit = (
  userId: string,
  authorId: string,
  role: Roles,
  isPublished: boolean,
): boolean => {
  return hasAuthority(userId, authorId) || (isAdmin(role) && isPublished);
};

// Note: 本人のみ削除可能
export const canDelete = (userId: string, authorId: string): boolean => {
  return hasAuthority(userId, authorId);
};
