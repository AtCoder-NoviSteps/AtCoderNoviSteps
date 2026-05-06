import { expect, test, describe, vi, afterEach } from 'vitest';

vi.mock('@sveltejs/kit', () => {
  const redirectImpl = (status: number, location: string) => {
    const err = new Error('Redirect') as Error & { status: number; location: string };
    err.name = 'Redirect';
    err.status = status;
    err.location = location;
    throw err;
  };

  const errorImpl = (status: number) => {
    const err = new Error('HttpError') as Error & { status: number };
    err.name = 'HttpError';
    err.status = status;
    throw err;
  };

  return { redirect: vi.fn(redirectImpl), error: vi.fn(errorImpl) };
});

vi.mock('$lib/services/users', () => ({
  getUser: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

import * as userService from '$lib/services/users';
import { Roles } from '$lib/types/user';
import { validateAdminAccess, validateAdminAccessForApi } from './admin_access';

const createMockLocalsWithSession = (username = 'admin-user') =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue({ user: { username } }),
    },
  }) as unknown as App.Locals;

const createMockLocalsWithoutSession = () =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue(null),
    },
  }) as unknown as App.Locals;

describe('validateAdminAccess', () => {
  describe('successful cases', () => {
    test('does not throw when user is admin', async () => {
      const mockLocals = createMockLocalsWithSession();
      vi.mocked(userService.getUser).mockResolvedValue({ role: Roles.ADMIN } as never);

      await expect(validateAdminAccess(mockLocals)).resolves;
    });
  });

  describe('error cases', () => {
    test('redirects to /login when no session', async () => {
      const mockLocals = createMockLocalsWithoutSession();

      await expect(validateAdminAccess(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login',
      });
    });

    test('redirects to /login when user is not admin', async () => {
      const mockLocals = createMockLocalsWithSession();
      vi.mocked(userService.getUser).mockResolvedValue({ role: Roles.USER } as never);

      await expect(validateAdminAccess(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login',
      });
    });

    test('redirects to /login?redirectTo=... when no session and url provided', async () => {
      const mockLocals = createMockLocalsWithoutSession();
      const mockUrl = new URL('http://localhost:5174/admin/tasks');

      await expect(validateAdminAccess(mockLocals, mockUrl)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login?redirectTo=%2Fadmin%2Ftasks',
      });
    });
  });
});

describe('validateAdminAccessForApi', () => {
  describe('successful cases', () => {
    test('does not throw when user is admin', async () => {
      const mockLocals = createMockLocalsWithSession();
      vi.mocked(userService.getUser).mockResolvedValue({ role: Roles.ADMIN } as never);

      await expect(validateAdminAccessForApi(mockLocals)).resolves;
    });
  });

  describe('error cases', () => {
    test('throws 401 when no session', async () => {
      const mockLocals = createMockLocalsWithoutSession();

      await expect(validateAdminAccessForApi(mockLocals)).rejects.toMatchObject({
        name: 'HttpError',
        status: 401,
      });
    });

    test('throws 403 when user is not admin', async () => {
      const mockLocals = createMockLocalsWithSession();
      vi.mocked(userService.getUser).mockResolvedValue({ role: Roles.USER } as never);

      await expect(validateAdminAccessForApi(mockLocals)).rejects.toMatchObject({
        name: 'HttpError',
        status: 403,
      });
    });
  });
});
