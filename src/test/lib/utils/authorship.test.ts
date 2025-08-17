import { expect, test, describe, vi } from 'vitest';

// Mock modules
vi.mock('@sveltejs/kit', () => {
  const redirectImpl = (status: number, location: string) => {
    const error = new Error('Redirect');

    (error as any).name = 'Redirect';
    (error as any).status = status;
    (error as any).location = location;

    throw error;
  };

  return { redirect: vi.fn(redirectImpl) };
});

import {
  ensureSessionOrRedirect,
  getLoggedInUser,
  isAdmin,
  hasAuthority,
  canRead,
  canEdit,
  canDelete,
} from '$lib/utils/authorship';
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
describe('ensureSessionOrRedirect', () => {
  test('expect not to throw when user has valid session', async () => {
    const mockLocals = {
      auth: {
        validate: vi.fn().mockResolvedValue({ user: { id: 'test-user' } }),
      },
    } as unknown as App.Locals;

    await expect(ensureSessionOrRedirect(mockLocals)).resolves.toBeUndefined();
  });

  test('expect to redirect when user has no session', async () => {
    const mockLocals = {
      auth: {
        validate: vi.fn().mockResolvedValue(null),
      },
    } as unknown as App.Locals;

    await expect(ensureSessionOrRedirect(mockLocals)).rejects.toMatchObject({
      name: 'Redirect',
      location: '/login',
    });
  });
});

describe('getLoggedInUser', () => {
  test('expect to return user when session and user exist', async () => {
    const mockUser = { id: 'test-user', name: 'Test User' };
    const mockLocals = {
      auth: {
        validate: vi.fn().mockResolvedValue({ user: mockUser }),
      },
      user: mockUser,
    } as unknown as App.Locals;

    const result = await getLoggedInUser(mockLocals);

    expect(result).toEqual(mockUser);
    expect(mockLocals.auth.validate).toHaveBeenCalledTimes(1);
  });

  test('expect to redirect when no session', async () => {
    const mockLocals = {
      auth: {
        validate: vi.fn().mockResolvedValue(null),
      },
    } as unknown as App.Locals;

    await expect(getLoggedInUser(mockLocals)).rejects.toMatchObject({
      name: 'Redirect',
      location: '/login',
    });
  });

  test('expect to redirect when session exists but no user', async () => {
    const mockLocals = {
      auth: {
        validate: vi.fn().mockResolvedValue({ user: { id: 'test-user' } }),
      },
      user: null,
    } as unknown as App.Locals;

    await expect(getLoggedInUser(mockLocals)).rejects.toMatchObject({
      name: 'Redirect',
      location: '/login',
    });
  });
});

describe('isAdmin', () => {
  test('expect to return true for ADMIN role', () => {
    expect(isAdmin(Roles.ADMIN)).toBe(true);
  });

  test('expect to return false for USER role', () => {
    expect(isAdmin(Roles.USER)).toBe(false);
  });
});

describe('Logged-in user id', () => {
  describe('has authority', () => {
    describe('when userId and authorId are the same', () => {
      const testCases = [
        { userId: adminId, authorId: adminId },
        { userId: userId1, authorId: userId1 },
        { userId: 'USER123', authorId: 'user123' },
        { userId: 'AuthorX', authorId: 'authorx' },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }: Authorship) => {
        expect(hasAuthority(userId, authorId)).toBe(true);
      });
    });

    describe('when userId and authorId are not the same', () => {
      const testCases = [
        { userId: adminId, authorId: userId1 },
        { userId: userId1, authorId: adminId },
      ];
      runTests('hasAuthority', testCases, ({ userId, authorId }: Authorship) => {
        expect(hasAuthority(userId, authorId)).toBe(false);
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
        { isPublished: true, userId: adminId, authorId: userId1 },
        { isPublished: true, userId: adminId, authorId: userId2 },
        { isPublished: true, userId: userId1, authorId: adminId },
        { isPublished: true, userId: userId1, authorId: userId1 },
        { isPublished: true, userId: userId2, authorId: userId1 },
        { isPublished: true, userId: userId1, authorId: userId2 },
      ];
      runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
        expect(canRead(isPublished, userId, authorId)).toBe(true);
      });
    });

    describe('when the workbook is not published', () => {
      describe('but the user is the author', () => {
        const testCases = [
          { isPublished: false, userId: adminId, authorId: adminId },
          { isPublished: false, userId: userId1, authorId: userId1 },
          { isPublished: false, userId: userId2, authorId: userId2 },
        ];
        runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
          expect(canRead(isPublished, userId, authorId)).toBe(true);
        });
      });

      describe('and the user is not the author', () => {
        const testCases = [
          { isPublished: false, userId: userId1, authorId: adminId },
          { isPublished: false, userId: userId2, authorId: adminId },
          { isPublished: false, userId: adminId, authorId: userId1 },
          { isPublished: false, userId: adminId, authorId: userId2 },
          { isPublished: false, userId: userId1, authorId: userId2 },
          { isPublished: false, userId: userId2, authorId: userId1 },
        ];
        runTests('canRead', testCases, ({ isPublished, userId, authorId }: AuthorshipForRead) => {
          expect(canRead(isPublished, userId, authorId)).toBe(false);
        });
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
    describe('when the user is the author', () => {
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
          expect(canEdit(userId, authorId, role, isPublished)).toBe(true);
        },
      );
    });

    describe('when the user is not the author but is admin and workbook is published', () => {
      const testCases = [
        { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: true },
        { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: true },
      ];
      runTests(
        'canEdit',
        testCases,
        ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
          expect(canEdit(userId, authorId, role, isPublished)).toBe(true);
        },
      );
    });

    describe('when the user is not the author', () => {
      describe('and the user is not admin', () => {
        const testCases = [
          { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: true },
          { userId: userId1, authorId: adminId, role: Roles.USER, isPublished: false },
          { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: true },
          { userId: userId2, authorId: adminId, role: Roles.USER, isPublished: false },
          { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: true },
          { userId: userId1, authorId: userId2, role: Roles.USER, isPublished: false },
          { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: true },
          { userId: userId2, authorId: userId1, role: Roles.USER, isPublished: false },
        ];
        runTests(
          'canEdit',
          testCases,
          ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
            expect(canEdit(userId, authorId, role, isPublished)).toBe(false);
          },
        );
      });

      describe('or the user is admin but workbook is not published', () => {
        const testCases = [
          { userId: adminId, authorId: userId1, role: Roles.ADMIN, isPublished: false },
          { userId: adminId, authorId: userId2, role: Roles.ADMIN, isPublished: false },
        ];
        runTests(
          'canEdit',
          testCases,
          ({ userId, authorId, role, isPublished }: AuthorshipForEdit) => {
            expect(canEdit(userId, authorId, role, isPublished)).toBe(false);
          },
        );
      });
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
    describe('when the user is the author', () => {
      const testCases = [
        { userId: adminId, authorId: adminId },
        { userId: userId1, authorId: userId1 },
        { userId: userId2, authorId: userId2 },
      ];
      runTests('canDelete', testCases, ({ userId, authorId }: AuthorshipForDelete) => {
        expect(canDelete(userId, authorId)).toBe(true);
      });
    });

    describe('when the user is not the author', () => {
      const testCases = [
        { userId: adminId, authorId: userId1 },
        { userId: adminId, authorId: userId2 },
        { userId: userId1, authorId: adminId },
        { userId: userId2, authorId: adminId },
        { userId: userId1, authorId: userId2 },
        { userId: userId2, authorId: userId1 },
      ];
      runTests('canDelete', testCases, ({ userId, authorId }: AuthorshipForDelete) => {
        expect(canDelete(userId, authorId)).toBe(false);
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
