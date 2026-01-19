import { vi, expect, describe, beforeEach, afterEach, test } from 'vitest';
import type { SuperValidated } from 'sveltekit-superforms';

// Mock external dependencies BEFORE importing the module under test
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

vi.mock('sveltekit-superforms/server', () => ({
  superValidate: vi.fn(),
}));

vi.mock('sveltekit-superforms/adapters', () => ({
  zod4: vi.fn(),
}));

vi.mock('$lib/zod/schema', () => ({
  authSchema: {
    _type: 'ZodObject',
    shape: {
      username: { type: 'string' },
      password: { type: 'string' },
    },
  },
}));

vi.mock('$lib/constants/http-response-status-codes', () => ({
  SEE_OTHER: 303,
}));

vi.mock('$lib/constants/navbar-links', () => ({
  HOME_PAGE: '/',
}));

// Import AFTER mocking
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';

import {
  initializeAuthForm,
  createAuthFormWithFallback,
  validateAuthFormWithFallback,
} from '$lib/utils/auth_forms';

// Mock console methods
const mockConsoleWarn = vi.fn();
const mockConsoleError = vi.fn();

// Helper function to create mock Request object
const createMockRequest = (username: string = '', password: string = '') => {
  return new Request('http://localhost:3000', {
    method: 'POST',
    body: new URLSearchParams({ username, password }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

// Mock locals object
const createMockLocals = (hasSession: boolean = false) =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue(hasSession ? { user: { id: 'test-user' } } : null),
    },
  }) as unknown as App.Locals;

describe('auth_forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.stubGlobal('console', {
      ...console,
      warn: mockConsoleWarn,
      error: mockConsoleError,
    });

    // Mock crypto.randomUUID for consistent testing
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-uuid-12345'),
    });

    // Improved request-aware superValidate mock
    vi.mocked(superValidate).mockImplementation(async (arg: unknown) => {
      let data = { username: '', password: '' };
      let posted = false;

      // If arg is a Request, parse its form data
      if (arg instanceof Request) {
        posted = arg.method?.toUpperCase() === 'POST';

        try {
          const formData = await arg.clone().formData();

          data = {
            username: formData.get('username')?.toString() || '',
            password: formData.get('password')?.toString() || '',
          };
        } catch {
          // If parsing fails, use default data
          data = { username: '', password: '' };
        }
      }

      return {
        id: 'test-form-id',
        valid: true,
        posted,
        data,
        errors: {},
        constraints: {
          username: { minlength: 3, maxlength: 24, required: true, pattern: '[\\w]*' },
          password: {
            minlength: 8,
            maxlength: 128,
            required: true,
            pattern: '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\\d)[a-zA-Z\\d]{8,128}',
          },
        },
        shape: {
          username: { type: 'string' },
          password: { type: 'string' },
        } as unknown,
        message: '',
      } as unknown as SuperValidated<Record<string, string>, string>;
    });

    vi.mocked(zod4).mockImplementation((schema: unknown) => schema as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initializeAuthForm', () => {
    test('expect to redirect to home page if user is already logged in', async () => {
      const mockLocals = createMockLocals(true);

      await expect(initializeAuthForm(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        location: '/',
      });
      expect(redirect).toHaveBeenCalledWith(303, '/');
    });

    test('expect to create auth form if user is not logged in', async () => {
      const mockLocals = createMockLocals(false);

      const result = await initializeAuthForm(mockLocals);

      expect(result).toBeDefined();
      expect(result.form).toBeDefined();
      expect(result.form.data).toEqual({ username: '', password: '' });
      expect(result.form.message).toBe('');
    });
  });

  describe('createAuthFormWithFallback', () => {
    test('expect to create form successfully with primary strategy', async () => {
      const result = await createAuthFormWithFallback();

      expect(result).toBeDefined();
      expect(result.form).toBeDefined();
      expect(result.form.data).toEqual({ username: '', password: '' });
      expect(result.form.valid).toBe(true);
      expect(result.form.posted).toBe(false);
      expect(result.form.errors).toEqual({});
      expect(result.form.message).toBe('');
    });

    test('expect to include constraints in the form', async () => {
      const result = await createAuthFormWithFallback();

      expect(result.form.constraints).toBeDefined();

      if (result.form.constraints) {
        expect(result.form.constraints.username).toEqual({
          minlength: 3,
          maxlength: 24,
          required: true,
          pattern: '[\\w]*',
        });
        expect(result.form.constraints.password).toEqual({
          minlength: 8,
          maxlength: 128,
          required: true,
          pattern: '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\\d)[a-zA-Z\\d]{8,128}',
        });
      }
    });

    test('expect to include shape property for production compatibility', async () => {
      const result = await createAuthFormWithFallback();

      expect(result.form.shape).toBeDefined();
      expect(result.form.shape).toEqual({
        username: { type: 'string' },
        password: { type: 'string' },
      });
    });

    test('expect to generate unique form ID using crypto.randomUUID', async () => {
      // Mock superValidate to fail so it falls back to createBaseAuthForm which uses crypto.randomUUID
      vi.mocked(superValidate).mockRejectedValueOnce(new Error('Primary strategy failed'));

      const result = await createAuthFormWithFallback();

      expect(result.form.id).toContain('error-fallback-form-');
      expect(globalThis.crypto.randomUUID).toHaveBeenCalled();
    });

    test('expect to use fallback ID generation when crypto.randomUUID is unavailable', async () => {
      // Mock crypto.randomUUID to be undefined (preserve other properties)
      const prevCrypto = globalThis.crypto;
      vi.stubGlobal('crypto', { ...(prevCrypto ?? {}), randomUUID: undefined });

      vi.mocked(superValidate).mockRejectedValueOnce(new Error('Primary strategy failed'));

      const result = await createAuthFormWithFallback();

      expect(result.form.id).toMatch(/^error-fallback-form-\d+-[a-z0-9]+$/);
    });

    test('expect to use fallback strategy when primary strategy fails', async () => {
      // Mock superValidate to fail
      vi.mocked(superValidate).mockRejectedValueOnce(new Error('SuperValidate failed'));

      const result = await createAuthFormWithFallback();

      expect(result).toBeDefined();
      expect(result.form).toBeDefined();
      expect(result.form.data).toEqual({ username: '', password: '' });
      expect(result.form.id).toContain('error-fallback-form-');

      if (import.meta.env.DEV) {
        expect(mockConsoleWarn).toHaveBeenCalled();
      } else {
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      }
    });
  });

  describe('validateAuthFormWithFallback', () => {
    test('expect to validate form successfully with valid request', async () => {
      const mockRequest = createMockRequest('testuser', 'TestPass123');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toBeDefined();
      expect(result.data).toEqual({
        username: 'testuser',
        password: 'TestPass123',
      });
      expect(result.posted).toBe(true);
      expect(result.message).toBe('');
    });

    test('expect to handle validation with empty form data', async () => {
      const mockRequest = createMockRequest('', '');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toBeDefined();
      expect(result.data).toEqual({
        username: '',
        password: '',
      });
      expect(result.posted).toBe(true);
    });

    test('expect to distinguish between POST and GET requests', async () => {
      // Test POST request
      const postRequest = createMockRequest('testuser', 'testpass');
      const postResult = await validateAuthFormWithFallback(postRequest);

      expect(postResult.posted).toBe(true);
      expect(postResult.data).toEqual({
        username: 'testuser',
        password: 'testpass',
      });

      // Test GET request (no form data)
      const getRequest = new Request('http://localhost:3000', { method: 'GET' });
      const getResult = await validateAuthFormWithFallback(getRequest);

      expect(getResult.posted).toBe(false);
      expect(getResult.data).toEqual({
        username: '',
        password: '',
      });
    });

    test('expect to use fallback strategy when primary validation fails', async () => {
      // Mock superValidate to fail
      vi.mocked(superValidate).mockRejectedValueOnce(new Error('Validation failed'));

      const mockRequest = createMockRequest('testuser', 'TestPass123');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toBeDefined();
      // When validation fails, but another strategy succeeds, valid could be true
      expect(result.posted).toBe(true);

      if (import.meta.env.DEV) {
        expect(mockConsoleWarn).toHaveBeenCalled();
      } else {
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      }
    });

    test('expect to handle complex form data', async () => {
      const mockRequest = createMockRequest('complexuser123', 'ComplexPass123!');

      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result).toBeDefined();
      expect(result.data).toEqual({
        username: 'complexuser123',
        password: 'ComplexPass123!',
      });
      expect(result.posted).toBe(true);
    });
  });

  describe('Strategy Pattern Implementation', () => {
    test('expect to log warnings in development mode when strategies fail', async () => {
      // Mock superValidate to fail for the first strategy
      vi.mocked(superValidate).mockRejectedValueOnce(new Error('First strategy failed'));

      await createAuthFormWithFallback();

      if (import.meta.env.DEV) {
        expect(mockConsoleWarn).toHaveBeenCalled();
      } else {
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      }
    });

    test('expect to handle Error objects correctly in strategy failure logging', async () => {
      const testError = new Error('Test error message');

      // Mock superValidate to fail with specific error
      vi.mocked(superValidate).mockRejectedValueOnce(testError);

      await createAuthFormWithFallback();

      if (import.meta.env.DEV) {
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Create authForm strategy: Failed to (Basic case) Use standard superValidate',
        );
        // Error objects are converted to string and include stack trace
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Error: Test error message'),
        );
      } else {
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      }
    });

    // Note: "expect to not log warnings in production mode" was removed
    // The test case is omitted because warnings are not recorded in the log,
    // and since this condition rarely occurs in the production environment.

    test('expect to handle non-Error objects in strategy failure logging', async () => {
      const testError = 'String error';

      // Mock superValidate to fail with non-Error object
      vi.mocked(superValidate).mockRejectedValueOnce(testError);

      await createAuthFormWithFallback();

      if (import.meta.env.DEV) {
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Create authForm strategy: Failed to (Basic case) Use standard superValidate',
        );
        expect(mockConsoleWarn).toHaveBeenCalledWith('String error');
      } else {
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      }
    });
  });

  describe('Form Structure Consistency', () => {
    test('expect to maintain consistent form structure across all strategies', async () => {
      const result = await createAuthFormWithFallback();

      // Validate required form properties
      expect(result.form).toHaveProperty('id');
      expect(result.form).toHaveProperty('data');
      expect(result.form).toHaveProperty('constraints');
      expect(result.form).toHaveProperty('shape');
      expect(result.form).toHaveProperty('valid');
      expect(result.form).toHaveProperty('posted');
      expect(result.form).toHaveProperty('errors');
      expect(result.form).toHaveProperty('message');
    });

    test('expect to ensure data structure is consistent', async () => {
      const result = await createAuthFormWithFallback();

      expect(result.form.data).toEqual({
        username: '',
        password: '',
      });
    });

    test('expect to validate that constraints follow expected pattern', async () => {
      const result = await createAuthFormWithFallback();

      const constraints = result.form.constraints;
      expect(constraints).toBeDefined();

      if (constraints) {
        // Username constraints
        expect(constraints.username?.minlength).toBe(3);
        expect(constraints.username?.maxlength).toBe(24);
        expect(constraints.username?.required).toBe(true);
        expect(constraints.username?.pattern).toBe('[\\w]*');

        // Password constraints
        expect(constraints.password?.minlength).toBe(8);
        expect(constraints.password?.maxlength).toBe(128);
        expect(constraints.password?.required).toBe(true);
        expect(constraints.password?.pattern).toBe(
          '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\\d)[a-zA-Z\\d]{8,128}',
        );
      }
    });
  });

  describe('Error Handling', () => {
    test('expect to handle validation fallback correctly', async () => {
      // Mock superValidate to fail
      vi.mocked(superValidate).mockRejectedValue(new Error('Validation failed'));

      const mockRequest = createMockRequest('testuser', 'TestPass123');
      const result = await validateAuthFormWithFallback(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.posted).toBe(true);
      expect(result.errors).toEqual({ _form: ['ログインできませんでした。'] });
      expect(result.message).toBe(
        'サーバでエラーが発生しました。本サービスの開発・運営チームまでご連絡ください。',
      );
    });
  });
});
