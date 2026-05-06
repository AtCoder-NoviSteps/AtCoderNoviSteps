import { expect, test, describe, vi, afterEach } from 'vitest';

vi.mock('@sveltejs/kit', () => {
  const redirectImpl = (status: number, location: string) => {
    const err = new Error('Redirect') as Error & { status: number; location: string };
    err.name = 'Redirect';
    err.status = status;
    err.location = location;
    throw err;
  };

  return { redirect: vi.fn(redirectImpl) };
});

afterEach(() => {
  vi.clearAllMocks();
});

import { ensureSessionOrRedirect, getLoggedInUser } from './session';

const createMockLocalsWithValidSession = (user = { id: 'test-user', name: 'Test User' }) =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue({ user: { id: user.id } }),
    },
    user,
  }) as unknown as App.Locals;

const createMockLocalsWithoutSession = () =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue(null),
    },
  }) as unknown as App.Locals;

const createMockLocalsWithSessionButNoUser = () =>
  ({
    auth: {
      validate: vi.fn().mockResolvedValue({ user: { id: 'test-user' } }),
    },
    user: null,
  }) as unknown as App.Locals;

const createMockUrlWorkbooksSlug = (slug = 'bfs') =>
  new URL(`http://localhost:5174/workbooks/${slug}`);

describe('ensureSessionOrRedirect', () => {
  describe('successful cases', () => {
    test('does not throw when user has valid session', async () => {
      const mockLocals = createMockLocalsWithValidSession();

      await expect(ensureSessionOrRedirect(mockLocals)).resolves;
      expect(mockLocals.auth.validate).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    test('redirects to /login when no session', async () => {
      const mockLocals = createMockLocalsWithoutSession();

      await expect(ensureSessionOrRedirect(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login',
      });
    });

    test('redirects to /login?redirectTo=... when no session exists and url is provided', async () => {
      const mockLocals = createMockLocalsWithoutSession();
      const mockUrl = createMockUrlWorkbooksSlug();

      await expect(ensureSessionOrRedirect(mockLocals, mockUrl)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login?redirectTo=%2Fworkbooks%2Fbfs',
      });
    });
  });
});

describe('getLoggedInUser', () => {
  describe('successful cases', () => {
    test('returns user when session and user exist', async () => {
      const mockUser = { id: 'test-user', name: 'Test User' };
      const mockLocals = createMockLocalsWithValidSession(mockUser) as unknown as App.Locals;

      const result = await getLoggedInUser(mockLocals);

      expect(result).toEqual(mockUser);
      expect(mockLocals.auth.validate).toHaveBeenCalledTimes(1);
    });

    test('returns user when session and user exist (with url param)', async () => {
      const mockUser = { id: 'test-user', name: 'Test User' };
      const mockLocals = createMockLocalsWithValidSession(mockUser) as unknown as App.Locals;
      const mockUrl = createMockUrlWorkbooksSlug();

      const result = await getLoggedInUser(mockLocals, mockUrl);

      expect(result).toEqual(mockUser);
    });
  });

  describe('error cases', () => {
    test('redirects to /login when no session', async () => {
      const mockLocals = createMockLocalsWithoutSession();

      await expect(getLoggedInUser(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login',
      });
    });

    test('redirects to /login when session exists but no user', async () => {
      const mockLocals = createMockLocalsWithSessionButNoUser();

      await expect(getLoggedInUser(mockLocals)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login',
      });
    });

    test('redirects to /login?redirectTo=... when no session exists and url is provided', async () => {
      const mockLocals = createMockLocalsWithoutSession();
      const mockUrl = createMockUrlWorkbooksSlug();

      await expect(getLoggedInUser(mockLocals, mockUrl)).rejects.toMatchObject({
        name: 'Redirect',
        status: expect.any(Number),
        location: '/login?redirectTo=%2Fworkbooks%2Fbfs',
      });
    });
  });
});
