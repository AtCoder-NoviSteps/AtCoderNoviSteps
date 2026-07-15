import { describe, test, expect, beforeEach, vi } from 'vitest';

import type { RequestEvent } from '@sveltejs/kit';
import { Roles } from '@prisma/client';

// dev = false so `secure: !dev` resolves to true (the production-relevant cookie flag)
vi.mock('$app/environment', () => ({ dev: false }));

vi.mock('$lib/server/session', () => ({
  SESSION_COOKIE_NAME: 'auth_session',
  validateSession: vi.fn(),
}));

import { createAuthRequest } from './auth';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/session';

const mockValidateSession = validateSession as unknown as ReturnType<typeof vi.fn>;

const VALID_SESSION = {
  sessionId: 'a'.repeat(40),
  user: { userId: 'abcdefghij12345', username: 'guest', role: Roles.USER },
};

const createMockEvent = (cookieValue?: string) => {
  const cookies = {
    get: vi.fn().mockReturnValue(cookieValue),
    set: vi.fn(),
    delete: vi.fn(),
  };

  return { cookies } as unknown as RequestEvent & {
    cookies: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAuthRequest', () => {
  describe('validate', () => {
    test('returns null and skips validateSession when no cookie is present', async () => {
      const event = createMockEvent(undefined);
      const auth = createAuthRequest(event);

      expect(await auth.validate()).toBeNull();
      expect(mockValidateSession).not.toHaveBeenCalled();
    });

    test('returns the validated session for a present, valid cookie', async () => {
      mockValidateSession.mockResolvedValue(VALID_SESSION);
      const event = createMockEvent(VALID_SESSION.sessionId);
      const auth = createAuthRequest(event);

      expect(await auth.validate()).toEqual(VALID_SESSION);
      expect(mockValidateSession).toHaveBeenCalledWith(VALID_SESSION.sessionId);
    });

    test('caches within the request: a second validate() does not re-query', async () => {
      mockValidateSession.mockResolvedValue(VALID_SESSION);
      const event = createMockEvent(VALID_SESSION.sessionId);
      const auth = createAuthRequest(event);

      await auth.validate();
      await auth.validate();

      expect(mockValidateSession).toHaveBeenCalledOnce();
    });

    test('clears the stale cookie and returns null when the session is invalid', async () => {
      mockValidateSession.mockResolvedValue(null);
      const event = createMockEvent('stale-session-id');
      const auth = createAuthRequest(event);

      expect(await auth.validate()).toBeNull();
      expect(event.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME, { path: '/' });
    });
  });

  describe('setSession', () => {
    test('sets the cookie with lucia v2 attributes for a session', () => {
      const event = createMockEvent();
      const auth = createAuthRequest(event);
      const idlePeriodExpiresAt = new Date('2026-07-29T00:00:00.000Z');

      auth.setSession({ sessionId: VALID_SESSION.sessionId, idlePeriodExpiresAt });

      expect(event.cookies.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, VALID_SESSION.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: true, // !dev, with dev mocked to false
        expires: idlePeriodExpiresAt,
      });
    });

    test('deletes the cookie when passed null', () => {
      const event = createMockEvent();
      const auth = createAuthRequest(event);

      auth.setSession(null);

      expect(event.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME, { path: '/' });
    });

    test('invalidates the request cache so the next validate() re-queries', async () => {
      mockValidateSession.mockResolvedValue(VALID_SESSION);
      const event = createMockEvent(VALID_SESSION.sessionId);
      const auth = createAuthRequest(event);

      await auth.validate();
      auth.setSession(null);
      await auth.validate();

      expect(mockValidateSession).toHaveBeenCalledTimes(2);
    });
  });
});
