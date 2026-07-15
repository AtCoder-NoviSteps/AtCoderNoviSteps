import { dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';

import {
  SESSION_COOKIE_NAME,
  validateSession,
  type SessionCookieData,
  type ValidatedSession,
} from '$lib/server/session';

export type AuthRequest = {
  validate: () => Promise<ValidatedSession | null>;
  setSession: (session: SessionCookieData | null) => void;
};

/**
 * Request-scoped auth handle that replaces lucia's `auth.handleRequest(event)`.
 * Reads/writes the session cookie and delegates session lookup to the self-managed session service.
 */
export const createAuthRequest = (event: RequestEvent): AuthRequest => {
  let validatePromise: Promise<ValidatedSession | null> | null = null;

  const setSessionCookie = (session: SessionCookieData | null): void => {
    if (session) {
      event.cookies.set(SESSION_COOKIE_NAME, session.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        expires: session.idlePeriodExpiresAt,
      });
    } else {
      event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
  };

  return {
    validate: () => {
      // request-scoped cache: hooks and route guards both call validate() on every request
      if (validatePromise) {
        return validatePromise;
      }

      validatePromise = (async () => {
        const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

        if (!sessionId) {
          return null;
        }

        const session = await validateSession(sessionId);

        if (!session) {
          setSessionCookie(null); // clear the stale cookie (lucia v2 behavior)
        }

        return session;
      })();

      return validatePromise;
    },
    setSession: (session) => {
      validatePromise = null;
      setSessionCookie(session);
    },
  };
};
