import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Roles } from '@prisma/client';

import client from '$lib/server/database';
import { generateRandomString } from '$lib/server/random';

// lucia v2 defaults: active 24h, idle +14d
const ACTIVE_PERIOD_MS = 1000 * 60 * 60 * 24;
const IDLE_PERIOD_MS = 1000 * 60 * 60 * 24 * 14;
const SESSION_ID_LENGTH = 40;

export const SESSION_COOKIE_NAME = 'auth_session';

export type SessionCookieData = { sessionId: string; idlePeriodExpiresAt: Date };

export type ValidatedSession = {
  sessionId: string;
  user: { userId: string; username: string; role: Roles };
};

export const createSession = async (userId: string): Promise<SessionCookieData> => {
  const sessionId = generateRandomString(SESSION_ID_LENGTH);
  const { activePeriodExpiresAt, idlePeriodExpiresAt } = computeExpirations(Date.now());

  await client.session.create({
    data: {
      id: sessionId,
      user_id: userId,
      active_expires: activePeriodExpiresAt.getTime(),
      idle_expires: idlePeriodExpiresAt.getTime(),
    },
  });

  return { sessionId, idlePeriodExpiresAt };
};

export const validateSession = async (sessionId: string): Promise<ValidatedSession | null> => {
  const session = await client.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  const now = Date.now();

  // lucia v2: expired only when now is strictly past the deadline; dead rows are kept (no cleanup)
  if (now > Number(session.idle_expires)) {
    return null;
  }

  if (now > Number(session.active_expires)) {
    // idle state: extend expirations keeping the same id (no rotation, cookie untouched)
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = computeExpirations(now);

    try {
      await client.session.update({
        where: { id: sessionId },
        data: {
          active_expires: activePeriodExpiresAt.getTime(),
          idle_expires: idlePeriodExpiresAt.getTime(),
        },
      });
    } catch (error) {
      // P2025: the row was deleted concurrently (e.g. logout) between findUnique and update.
      // Treat the session as gone (unauthenticated) instead of surfacing a 500.
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  return {
    sessionId: session.id,
    user: {
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
    },
  };
};

export const invalidateSession = async (sessionId: string): Promise<void> => {
  try {
    await client.session.delete({ where: { id: sessionId } });
  } catch (error) {
    // P2025 (row already gone): swallow for logout idempotency, same as the lucia adapter
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return;
    }

    throw error;
  }
};

const computeExpirations = (now: number) => {
  const activePeriodExpiresAt = new Date(now + ACTIVE_PERIOD_MS);
  const idlePeriodExpiresAt = new Date(activePeriodExpiresAt.getTime() + IDLE_PERIOD_MS);

  return { activePeriodExpiresAt, idlePeriodExpiresAt };
};
