import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';

import {
  createAuthFormWithFallback,
  validateAuthFormWithFallback,
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

// Mock modules for testing
vi.mock('sveltekit-superforms/server', () => ({
  superValidate: vi.fn(),
}));

vi.mock('sveltekit-superforms/adapters', () => ({
  zod: vi.fn(),
}));

vi.mock('$lib/zod/schema', () => ({
  authSchema: {},
}));

describe('createAuthFormWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Auth form for successful cases', () => {
    test('expect to be succeed with basic superValidate strategy', async () => {
      const mockForm = {
        id: 'test-form-id',
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        constraints: {},
        shape: {},
      };

      vi.mocked(superValidate).mockResolvedValueOnce(mockForm);
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form).toMatchObject({
        valid: true,
        data: { username: '', password: '' },
        message: '',
      });
    });

    test('expect to fallback to explicit zod adapter when basic strategy fails', async () => {
      const mockForm = {
        id: 'test-form-id',
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        constraints: {},
        shape: {},
      };

      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Failed to create with basic strategy'))
        .mockResolvedValueOnce(mockForm);
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form).toMatchObject({
        valid: true,
        data: { username: '', password: '' },
        message: '',
      });
    });

    test('expect to use manual form creation when all superValidate attempts fail', async () => {
      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Failed to create strategy using SuperValidate'))
        .mockRejectedValueOnce(new Error('Failed to create strategy with zod adapter'));
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form).toMatchObject({
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        message: '',
      });
      expect(result.form.constraints).toBeDefined();
      expect(result.form.shape).toBeDefined();
    });
  });

  describe('return value validation', () => {
    test('expect to return valid form structure', async () => {
      vi.mocked(superValidate).mockRejectedValue(new Error('Force manual fallback'));
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form).toHaveProperty('id');
      expect(result.form).toHaveProperty('valid');
      expect(result.form).toHaveProperty('posted');
      expect(result.form).toHaveProperty('data');
      expect(result.form).toHaveProperty('errors');
      expect(result.form).toHaveProperty('constraints');
      expect(result.form).toHaveProperty('shape');
      expect(result.form).toHaveProperty('message');
    });

    test('expect to include correct constraints', async () => {
      vi.mocked(superValidate).mockRejectedValue(new Error('Force manual fallback'));
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form.constraints).toMatchObject({
        username: {
          minlength: 3,
          maxlength: 24,
          required: true,
          pattern: '[\\w]*',
        },
        password: {
          minlength: 8,
          maxlength: 128,
          required: true,
          pattern: '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\\d)[a-zA-Z\\d]{8,128}',
        },
      });
    });

    test('expect to include shape property for production compatibility', async () => {
      vi.mocked(superValidate).mockRejectedValue(new Error('Force manual fallback'));
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      expect(result.form.shape).toMatchObject({
        username: { type: 'string' },
        password: { type: 'string' },
      });
    });
  });

  describe('Auth form for error cases', () => {
    test('expect to handle errors during strategy execution gracefully', async () => {
      // Mock console.warn to spy on error logging
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock first two strategies to fail, third should succeed
      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Failed to create basic strategy'))
        .mockRejectedValueOnce(new Error('Failed to create strategy with zod adapter'));
      vi.mocked(zod).mockReturnValue({} as any);

      const result = await createAuthFormWithFallback();

      // Should successfully fallback to manual creation
      expect(result.form).toMatchObject({
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        message: '',
      });
      expect(result.form.constraints).toBeDefined();
      expect(result.form.shape).toBeDefined();

      // Console.warn should be called in DEV environment
      // (Note: This depends on import.meta.env.DEV being true in test environment)
      consoleWarnSpy.mockRestore();
    });

    test('expect to handle zod adapter creation errors', async () => {
      // Mock zod to throw an error
      vi.mocked(zod)
        .mockImplementationOnce(() => {
          throw new Error('Failed to create Zod adapter');
        })
        .mockImplementationOnce(() => {
          throw new Error('Failed to create Zod adapter again');
        })
        .mockReturnValue({} as any); // Third call succeeds for manual creation

      vi.mocked(superValidate).mockRejectedValue(
        new Error('Failed to create strategy with SuperValidate'),
      );

      const result = await createAuthFormWithFallback();

      // Expect to succeed with manual creation
      expect(result.form).toMatchObject({
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        message: '',
      });
    });

    test('expect to handle unexpected error types gracefully', async () => {
      // Mock superValidate to throw non-Error objects
      vi.mocked(superValidate)
        .mockRejectedValueOnce('String error instead of Error object')
        .mockRejectedValueOnce(null)
        .mockRejectedValueOnce(undefined);
      vi.mocked(zod).mockReturnValue({} as any);

      // Should still fallback to manual creation successfully
      const result = await createAuthFormWithFallback();

      expect(result.form).toMatchObject({
        valid: true,
        posted: false,
        data: { username: '', password: '' },
        errors: {},
        message: '',
      });
      expect(result.form.constraints).toBeDefined();
      expect(result.form.shape).toBeDefined();
    });
  });
});

describe('validateAuthFormWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Creates a mock HTTP Request object for testing authentication endpoints.
   *
   * @param username - The username to include in the request body
   * @param password - The password to include in the request body
   * @returns A Request object with POST method, form-encoded body containing credentials, and appropriate headers
   *
   * @example
   * ```typescript
   * const request = createMockRequest('john_doe', 'secret123');
   * // Creates a POST request to localhost with username and password in the body
   * ```
   */
  function createMockRequest(username: string, password: string): Request {
    return new Request('http://localhost', {
      method: 'POST',
      body: new URLSearchParams({ username, password }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  describe('Auth form for successful cases', () => {
    test('expect to validate valid form data successfully', async () => {
      const mockForm = {
        id: 'test-form-id',
        valid: true,
        posted: true,
        data: { username: 'testuser', password: 'TestPass123' },
        errors: {},
        constraints: {},
        shape: {},
      };

      vi.mocked(superValidate).mockResolvedValueOnce(mockForm);
      vi.mocked(zod).mockReturnValue({} as any);

      const mockRequest = createMockRequest('testuser', 'TestPass123');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toMatchObject({
        valid: true,
        data: { username: 'testuser', password: 'TestPass123' },
      });
    });

    test('expect to return form with validation errors for invalid data', async () => {
      const mockForm = {
        id: 'test-form-id',
        valid: false,
        posted: true,
        data: { username: 'ab', password: '123' },
        errors: {
          username: ['Username too short'],
          password: ['Password too short'],
        },
        constraints: {},
        shape: {},
      };

      vi.mocked(superValidate).mockResolvedValueOnce(mockForm);
      vi.mocked(zod).mockReturnValue({} as any);

      const mockRequest = createMockRequest('ab', '123');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('expect to fallback to manual form when validation fails', async () => {
      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Failed to create strategy using SuperValidate'))
        .mockRejectedValueOnce(new Error('Failed to create strategy with zod adapter'));
      vi.mocked(zod).mockReturnValue({} as any);

      const mockRequest = createMockRequest('testuser', 'TestPass123');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toMatchObject({
        valid: false,
        posted: true,
        data: { username: '', password: '' },
        errors: { _form: ['ログインできませんでした。'] },
        message: 'サーバでエラーが発生しました。本サービスの開発・運営チームまでご連絡ください。',
      });
    });
  });

  describe('Auth form for error cases', () => {
    test('expect to handle invalid Request object gracefully', async () => {
      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Invalid request'))
        .mockRejectedValueOnce(new Error('Invalid request'));
      vi.mocked(zod).mockReturnValue({} as any);

      const mockRequest = {} as Request;

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toMatchObject({
        valid: false,
        posted: true,
        errors: { _form: ['ログインできませんでした。'] },
      });
    });
  });

  describe('fallback strategy', () => {
    test('expect to return error form with appropriate message', async () => {
      vi.mocked(superValidate)
        .mockRejectedValueOnce(new Error('Failed to create strategy using SuperValidate'))
        .mockRejectedValueOnce(new Error('Failed to create strategy with zod adapter'));
      vi.mocked(zod).mockReturnValue({} as any);

      const mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: new URLSearchParams({}).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.posted).toBe(true);
      expect(result.errors).toMatchObject({
        _form: ['ログインできませんでした。'],
      });
      expect(result.message).toBe(
        'サーバでエラーが発生しました。本サービスの開発・運営チームまでご連絡ください。',
      );
      expect(result.constraints).toBeDefined();
      expect(result.shape).toBeDefined();
    });
  });
});

// HACK: Environment dependent tests are currently disabled due to
// complexity in mocking import.meta.env.DEV in vitest

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
