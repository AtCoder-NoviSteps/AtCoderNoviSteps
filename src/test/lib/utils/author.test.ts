import { expect, test } from 'vitest';
import { hasAuthority, canRead, canEdit } from '$lib/utils/author';
import { Roles } from '$lib/types/user';

const adminId = '1';
const userId1 = '2';
const userId2 = '3';

// See:
// https://vitest.dev/api/#describe
// https://vitest.dev/api/#test-each
describe('LoggedIn user', () => {
  const testCasesForHasAuthority = [
    { userId: adminId, authorId: adminId, expected: true },
    { userId: userId1, authorId: userId1, expected: true },
    { userId: adminId, authorId: userId1, expected: false },
    { userId: userId1, authorId: adminId, expected: false },
  ];
  test.each(testCasesForHasAuthority)(
    'hasAuthority(userId: $userId, authorId: $authorId) -> $expected',
    ({ userId, authorId, expected }) => {
      expect(hasAuthority(userId, authorId)).toBe(expected);
    },
  );

  // Note: 公開 + 非公開(本人のみ)の問題集が閲覧できる
  const testCasesForCanRead = [
    { isPublished: true, userId: adminId, authorId: adminId, expected: true },
    { isPublished: true, userId: userId1, authorId: adminId, expected: true },
    { isPublished: true, userId: userId1, authorId: userId1, expected: true },
    { isPublished: true, userId: userId2, authorId: userId1, expected: true },
    { isPublished: true, userId: userId1, authorId: userId2, expected: true },
    { isPublished: true, userId: adminId, authorId: userId1, expected: true },
    { isPublished: true, userId: adminId, authorId: userId2, expected: true },
    { isPublished: false, userId: adminId, authorId: adminId, expected: true },
    { isPublished: false, userId: userId1, authorId: userId1, expected: true },
    { isPublished: false, userId: userId2, authorId: userId2, expected: true },
    { isPublished: false, userId: userId1, authorId: adminId, expected: false },
    { isPublished: false, userId: userId2, authorId: adminId, expected: false },
    { isPublished: false, userId: adminId, authorId: userId1, expected: false },
    { isPublished: false, userId: adminId, authorId: userId2, expected: false },
    { isPublished: false, userId: userId1, authorId: userId2, expected: false },
    { isPublished: false, userId: userId2, authorId: userId1, expected: false },
  ];
  test.each(testCasesForCanRead)(
    'canRead(isPublished: $isPublished, userId: $userId, authorId: $authorId) -> $expected',
    ({ isPublished, userId, authorId, expected }) => {
      expect(canRead(isPublished, userId, authorId)).toBe(expected);
    },
  );

  const testCasesForCanEdit = [
    { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: true, expected: true },
    { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: false, expected: true },
    { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: true, expected: true },
    { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: false, expected: true },
    { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: true, expected: true },
    { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: false, expected: true },
    { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: true, expected: true },
    { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: true, expected: true },
    { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: true, expected: false },
    { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: false, expected: false },
    { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: true, expected: false },
    { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: false, expected: false },
    { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: false, expected: false },
    { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: false, expected: false },
    { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: true, expected: false },
    { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: false, expected: false },
    { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: true, expected: false },
    { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: false, expected: false },
  ];
  test.each(testCasesForCanEdit)(
    'canEdit(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished) -> $expected',
    ({ userId, authorId, role, isPublished, expected }) => {
      expect(canEdit(userId, authorId, role, isPublished)).toBe(expected);
    },
  );

  // TODO: canDeleteのテストを追加
});
