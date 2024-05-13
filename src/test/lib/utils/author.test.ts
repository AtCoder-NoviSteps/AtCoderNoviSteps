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
    describe('true: published workbooks can be viewed', () => {
      const testCases = [
        { isPublished: true, userId: adminId, authorId: adminId, expected: true },
        { isPublished: true, userId: userId1, authorId: adminId, expected: true },
        { isPublished: true, userId: userId1, authorId: userId1, expected: true },
        { isPublished: true, userId: userId2, authorId: userId1, expected: true },
        { isPublished: true, userId: userId1, authorId: userId2, expected: true },
        { isPublished: true, userId: adminId, authorId: userId1, expected: true },
        { isPublished: true, userId: adminId, authorId: userId2, expected: true },
      ];
      test.each(testCases)(
        'canRead(isPublished: $isPublished, userId: $userId, authorId: $authorId) -> $expected',
        ({ isPublished, userId, authorId, expected }) => {
          expect(canRead(isPublished, userId, authorId)).toBe(expected);
        },
      );
    });

    describe('true: unpublished workbook created by oneself can be viewed', () => {
      const testCases = [
        { isPublished: false, userId: adminId, authorId: adminId, expected: true },
        { isPublished: false, userId: userId1, authorId: userId1, expected: true },
        { isPublished: false, userId: userId2, authorId: userId2, expected: true },
      ];
      test.each(testCases)(
        'canRead(isPublished: $isPublished, userId: $userId, authorId: $authorId) -> $expected',
        ({ isPublished, userId, authorId, expected }) => {
          expect(canRead(isPublished, userId, authorId)).toBe(expected);
        },
      );
    });

    describe('false: unpublished workbook created by others cannot be viewed', () => {
      const testCases = [
        { isPublished: false, userId: userId1, authorId: adminId, expected: false },
        { isPublished: false, userId: userId2, authorId: adminId, expected: false },
        { isPublished: false, userId: adminId, authorId: userId1, expected: false },
        { isPublished: false, userId: adminId, authorId: userId2, expected: false },
        { isPublished: false, userId: userId1, authorId: userId2, expected: false },
        { isPublished: false, userId: userId2, authorId: userId1, expected: false },
      ];
      test.each(testCases)(
        'canRead(isPublished: $isPublished, userId: $userId, authorId: $authorId) -> $expected',
        ({ isPublished, userId, authorId, expected }) => {
          expect(canRead(isPublished, userId, authorId)).toBe(expected);
        },
      );
    });

    // TODO: runTest()を用意してDRYに
  });

  describe('can edit', () => {
    describe('true: workbooks created by oneself can be edited', () => {
      const testCases = [
        {
          userId: adminId,
          authorId: adminId,
          role: Roles.ADMIN,
          isPublished: true,
          expected: true,
        },
        {
          userId: adminId,
          authorId: adminId,
          role: Roles.ADMIN,
          isPublished: false,
          expected: true,
        },
        { userId: userId1, authorId: userId1, role: Roles.USER, isPublished: true, expected: true },
        {
          userId: userId1,
          authorId: userId1,
          role: Roles.USER,
          isPublished: false,
          expected: true,
        },
        { userId: userId2, authorId: userId2, role: Roles.USER, isPublished: true, expected: true },
        {
          userId: userId2,
          authorId: userId2,
          role: Roles.USER,
          isPublished: false,
          expected: true,
        },
      ];
      test.each(testCases)(
        'canEdit(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished) -> $expected',
        ({ userId, authorId, role, isPublished, expected }) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBe(expected);
        },
      );
    });

    describe('true: (special case) admin can edit workbooks created by users', () => {
      const testCases = [
        {
          userId: adminId,
          authorId: userId1,
          role: Roles.ADMIN,
          isPublished: true,
          expected: true,
        },
        {
          userId: adminId,
          authorId: userId2,
          role: Roles.ADMIN,
          isPublished: true,
          expected: true,
        },
      ];
      test.each(testCases)(
        'canEdit(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished) -> $expected',
        ({ userId, authorId, role, isPublished, expected }) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBe(expected);
        },
      );
    });

    describe('false: workbooks created by others cannot be edited', () => {
      const testCases = [
        {
          userId: userId1,
          authorId: adminId,
          role: Roles.USER,
          isPublished: true,
          expected: false,
        },
        {
          userId: userId1,
          authorId: adminId,
          role: Roles.USER,
          isPublished: false,
          expected: false,
        },
        {
          userId: userId2,
          authorId: adminId,
          role: Roles.USER,
          isPublished: true,
          expected: false,
        },
        {
          userId: userId2,
          authorId: adminId,
          role: Roles.USER,
          isPublished: false,
          expected: false,
        },
        {
          userId: adminId,
          authorId: userId1,
          role: Roles.ADMIN,
          isPublished: false,
          expected: false,
        },
        {
          userId: adminId,
          authorId: userId2,
          role: Roles.ADMIN,
          isPublished: false,
          expected: false,
        },
        {
          userId: userId1,
          authorId: userId2,
          role: Roles.USER,
          isPublished: true,
          expected: false,
        },
        {
          userId: userId1,
          authorId: userId2,
          role: Roles.USER,
          isPublished: false,
          expected: false,
        },
        {
          userId: userId2,
          authorId: userId1,
          role: Roles.USER,
          isPublished: true,
          expected: false,
        },
        {
          userId: userId2,
          authorId: userId1,
          role: Roles.USER,
          isPublished: false,
          expected: false,
        },
      ];
      test.each(testCases)(
        'canEdit(userId: $userId, authorId: $authorId, role: $role, isPublished: $isPublished) -> $expected',
        ({ userId, authorId, role, isPublished, expected }) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBe(expected);
        },
      );
    });

    // TODO: runTest()を用意してDRYに
  });

  // TODO: canDeleteのテストを追加
});
