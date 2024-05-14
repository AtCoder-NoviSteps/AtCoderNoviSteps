import { expect, test } from 'vitest';
import { hasAuthority, canRead, canEdit } from '$lib/utils/author';
import { Roles } from '$lib/types/user';

const adminId = '1';
const userId1 = '2';
const userId2 = '3';

// See:
// https://vitest.dev/api/#describe
// https://vitest.dev/api/#test-each
describe('Logged-in user id', () => {
  describe('has authority', () => {
    describe('return true when userId and authorId are the same', () => {
      const testCases = [
        { userId: adminId, authorId: adminId },
        { userId: userId1, authorId: userId1 },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }) => {
        expect(hasAuthority(userId, authorId)).toBeTruthy();
      });
    });

    describe('return false when userId and authorId are not same ', () => {
      const testCases = [
        { userId: adminId, authorId: userId1 },
        { userId: userId1, authorId: adminId },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }) => {
        expect(hasAuthority(userId, authorId)).toBeFalsy();
      });
    });

    function runTests(testName, testCases, testFunction) {
      test.each(testCases)(`${testName}(userId: $userId, authorId: $authorId)`, testFunction);
    }
  });

  describe('can read', () => {
    describe('return true because published workbooks can be viewed', () => {
      const testCases = [
        { isPublished: true, userId: adminId, authorId: adminId },
        { isPublished: true, userId: userId1, authorId: adminId },
        { isPublished: true, userId: userId1, authorId: userId1 },
        { isPublished: true, userId: userId2, authorId: userId1 },
        { isPublished: true, userId: userId1, authorId: userId2 },
        { isPublished: true, userId: adminId, authorId: userId1 },
        { isPublished: true, userId: adminId, authorId: userId2 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }) => {
        expect(canRead(isPublished, userId, authorId)).toBeTruthy();
      });
    });

    describe('return true because unpublished workbook created by oneself can be viewed', () => {
      const testCases = [
        { isPublished: false, userId: adminId, authorId: adminId },
        { isPublished: false, userId: userId1, authorId: userId1 },
        { isPublished: false, userId: userId2, authorId: userId2 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }) => {
        expect(canRead(isPublished, userId, authorId)).toBeTruthy();
      });
    });

    describe('return false because unpublished workbook created by others cannot be viewed', () => {
      const testCases = [
        { isPublished: false, userId: userId1, authorId: adminId },
        { isPublished: false, userId: userId2, authorId: adminId },
        { isPublished: false, userId: adminId, authorId: userId1 },
        { isPublished: false, userId: adminId, authorId: userId2 },
        { isPublished: false, userId: userId1, authorId: userId2 },
        { isPublished: false, userId: userId2, authorId: userId1 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }) => {
        expect(canRead(isPublished, userId, authorId)).toBeFalsy();
      });
    });

    function runTests(testName, testCases, testFunction) {
      test.each(testCases)(
        `${testName}(isPublished: $isPublished, userId: $userId, authorId: $authorId)`,
        testFunction,
      );
    }
  });

  describe('can edit', () => {
    describe('return true because workbooks created by oneself can be edited', () => {
      const testCases = [
        { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: true },
        { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: false },
        { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: true },
        { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: false },
        { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: true },
        { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: false },
      ];
      runTests('canEdit', testCases, ({ userId, authorId, role, isPublished }) => {
        expect(canEdit(userId, authorId, role, isPublished)).toBeTruthy();
      });
    });

    describe('return true because admin can edit workbooks created by users (special case) ', () => {
      const testCases = [
        { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: true },
        { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: true },
      ];
      runTests('canEdit', testCases, ({ userId, authorId, role, isPublished }) => {
        expect(canEdit(userId, authorId, role, isPublished)).toBeTruthy();
      });
    });

    describe('return false because workbooks created by others cannot be edited', () => {
      const testCases = [
        { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: true },
        { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: false },
        { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: true },
        { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: false },
        { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: false },
        { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: false },
        { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: true },
        { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: false },
        { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: true },
        { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: false },
      ];
      runTests('canEdit', testCases, ({ userId, authorId, role, isPublished }) => {
        expect(canEdit(userId, authorId, role, isPublished)).toBeFalsy();
      });
    });

    function runTests(testName, testCases, testFunction) {
      test.each(testCases)(
        `${testName}(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished) -> $expected`,
        testFunction,
      );
    }
  });

  // TODO: canDeleteのテストを追加
});
