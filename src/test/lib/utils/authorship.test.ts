import { expect, test } from 'vitest';
import { hasAuthority, canRead, canEdit, canDelete } from '$lib/utils/authorship';
import type {
  Authorship,
  AuthorshipForRead,
  AuthorshipForEdit,
  AuthorshipForDelete,
} from '$lib/types/authorship';
import { Roles } from '$lib/types/user';

const adminId = '1';
const userId1 = '2';
const userId2 = '3';

// See:
// https://vitest.dev/api/#describe
// https://vitest.dev/api/#test-each
describe('Logged-in user id', () => {
  describe('has authority', () => {
    describe('when userId and authorId are the same', () => {
      const testCases = [
        { userId: adminId, authorId: adminId },
        { userId: userId1, authorId: userId1 },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }: Authorship) => {
        expect(hasAuthority(userId, authorId)).toBeTruthy();
      });
    });

    describe('when userId and authorId are not same ', () => {
      const testCases = [
        { userId: adminId, authorId: userId1 },
        { userId: userId1, authorId: adminId },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }: Authorship) => {
        expect(hasAuthority(userId, authorId)).toBeFalsy();
      });
    });

    function runTests(
      testName: string,
      testCases: Authorship[],
      testFunction: (testCase: Authorship) => void,
    ) {
      test.each(testCases)(`${testName}(userId: $userId, authorId: $authorId)`, testFunction);
    }
  });

  describe('can read', () => {
    describe('when the workbook is published', () => {
      const testCases = [
        { isPublished: true, userId: adminId, authorId: adminId },
        { isPublished: true, userId: userId1, authorId: adminId },
        { isPublished: true, userId: userId1, authorId: userId1 },
        { isPublished: true, userId: userId2, authorId: userId1 },
        { isPublished: true, userId: userId1, authorId: userId2 },
        { isPublished: true, userId: adminId, authorId: userId1 },
        { isPublished: true, userId: adminId, authorId: userId2 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
        expect(canRead(isPublished, userId, authorId)).toBeTruthy();
      });
    });

    describe('when the workbook is unpublished but created by oneself', () => {
      const testCases = [
        { isPublished: false, userId: adminId, authorId: adminId },
        { isPublished: false, userId: userId1, authorId: userId1 },
        { isPublished: false, userId: userId2, authorId: userId2 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
        expect(canRead(isPublished, userId, authorId)).toBeTruthy();
      });
    });

    describe('when the workbook is unpublished and created by others', () => {
      const testCases = [
        { isPublished: false, userId: userId1, authorId: adminId },
        { isPublished: false, userId: userId2, authorId: adminId },
        { isPublished: false, userId: adminId, authorId: userId1 },
        { isPublished: false, userId: adminId, authorId: userId2 },
        { isPublished: false, userId: userId1, authorId: userId2 },
        { isPublished: false, userId: userId2, authorId: userId1 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
        expect(canRead(isPublished, userId, authorId)).toBeFalsy();
      });
    });

    function runTests(
      testName: string,
      testCases: AuthorshipForRead[],
      testFunction: (testCase: AuthorshipForRead) => void,
    ) {
      test.each(testCases)(
        `${testName}(isPublished: $isPublished, userId: $userId, authorId: $authorId)`,
        testFunction,
      );
    }
  });

  describe('can edit', () => {
    describe('when the workbook is created by oneself', () => {
      const testCases = [
        { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: true },
        { userId: adminId, authorId: adminId, role: Roles.ADMIN, isPublished: false },
        { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: true },
        { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: false },
        { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: true },
        { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: false },
      ];
      runTests(
        'canEdit',
        testCases,
        ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBeTruthy();
        },
      );
    });

    describe('(special case) admin can edit workbooks created by users', () => {
      const testCases = [
        { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: true },
        { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: true },
      ];
      runTests(
        'canEdit',
        testCases,
        ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBeTruthy();
        },
      );
    });

    describe('when the workbook is created by others', () => {
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
      runTests(
        'canEdit',
        testCases,
        ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBeFalsy();
        },
      );
    });

    function runTests(
      testName: string,
      testCases: AuthorshipForEdit[],
      testFunction: (testCase: AuthorshipForEdit) => void,
    ) {
      test.each(testCases)(
        `${testName}(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished)`,
        testFunction,
      );
    }
  });

  describe('can delete', () => {
    describe('when the workbook is created by oneself', () => {
      const testCases = [
        { userId: adminId, authorId: adminId },
        { userId: userId1, authorId: userId1 },
        { userId: userId2, authorId: userId2 },
      ];
      runTests('canDelete', testCases, ({ userId, authorId }: AuthorshipForDelete) => {
        expect(canDelete(userId, authorId)).toBeTruthy();
      });
    });

    describe('when the workbook is created by others', () => {
      const testCases = [
        { userId: adminId, authorId: userId1 },
        { userId: adminId, authorId: userId2 },
        { userId: userId1, authorId: adminId },
        { userId: userId2, authorId: adminId },
        { userId: userId1, authorId: userId2 },
        { userId: userId2, authorId: userId1 },
      ];
      runTests('canDelete', testCases, ({ userId, authorId }: AuthorshipForDelete) => {
        expect(canDelete(userId, authorId)).toBeFalsy();
      });
    });

    function runTests(
      testName: string,
      testCases: AuthorshipForDelete[],
      testFunction: (testCase: AuthorshipForDelete) => void,
    ) {
      test.each(testCases)(`${testName}(userId: $userId, authorId: $authorId)`, testFunction);
    }
  });
});
