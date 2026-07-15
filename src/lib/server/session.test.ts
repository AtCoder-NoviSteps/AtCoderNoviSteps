import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { Prisma, Roles } from '@prisma/client';

vi.mock('$lib/server/database', () => ({
  default: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import db from '$lib/server/database';
import { createSession, validateSession, invalidateSession, SESSION_COOKIE_NAME } from './session';

const mockDb = db as unknown as {
  session: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

// lucia v2 defaults, duplicated here so assertions pin literal periods rather than the impl's constants
const ACTIVE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24h
const IDLE_PERIOD_MS = 1000 * 60 * 60 * 24 * 14; // 14d

// fixed clock so expiration math is deterministic under fake timers
const NOW = new Date('2026-07-15T00:00:00.000Z').getTime();

const SESSION_ID = 'a'.repeat(40);
const USER = { id: 'abcdefghij12345', username: 'guest', role: Roles.USER };

// active_expires / idle_expires MUST be BigInt here: Prisma returns them as bigint, so a Number mock
// would hide a missing Number() conversion in the implementation.
const buildSessionRow = (activeExpires: number, idleExpires: number) => ({
  id: SESSION_ID,
  user_id: USER.id,
  active_expires: BigInt(activeExpires),
  idle_expires: BigInt(idleExpires),
  user: { id: USER.id, username: USER.username, role: USER.role },
});

// a fully-active session (both deadlines well in the future); shared by the two active-state cases
const activeSessionRow = () =>
  buildSessionRow(NOW + ACTIVE_PERIOD_MS, NOW + ACTIVE_PERIOD_MS + IDLE_PERIOD_MS);

const mockFindUnique = (row: ReturnType<typeof buildSessionRow> | null) =>
  mockDb.session.findUnique.mockResolvedValue(row);

const buildPrismaError = (code: string, message: string) =>
  new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: '5.0.0' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSession', () => {
  test('creates a row with a 40-char [a-z0-9] id and lucia v2 expirations', async () => {
    const result = await createSession(USER.id);

    expect(result.sessionId).toMatch(/^[a-z0-9]{40}$/);
    // expirations are written as Number (not BigInt), matching the previous lucia adapter
    expect(mockDb.session.create).toHaveBeenCalledWith({
      data: {
        id: result.sessionId,
        user_id: USER.id,
        active_expires: NOW + ACTIVE_PERIOD_MS,
        idle_expires: NOW + ACTIVE_PERIOD_MS + IDLE_PERIOD_MS,
      },
    });
  });

  test('returns the idle-period expiry as the cookie expiry Date', async () => {
    const result = await createSession(USER.id);

    expect(result.idlePeriodExpiresAt).toEqual(new Date(NOW + ACTIVE_PERIOD_MS + IDLE_PERIOD_MS));
  });
});

describe('validateSession', () => {
  describe('active session (now <= active_expires)', () => {
    test('returns the session and user without updating or deleting', async () => {
      mockFindUnique(activeSessionRow());

      const result = await validateSession(SESSION_ID);

      expect(result).toEqual({
        sessionId: SESSION_ID,
        user: { userId: USER.id, username: USER.username, role: USER.role },
      });
      expect(mockDb.session.update).not.toHaveBeenCalled();
      expect(mockDb.session.delete).not.toHaveBeenCalled();
    });

    test('reads the session and user in a single findUnique with include: { user: true }', async () => {
      mockFindUnique(activeSessionRow());

      await validateSession(SESSION_ID);

      expect(mockDb.session.findUnique).toHaveBeenCalledWith({
        where: { id: SESSION_ID },
        include: { user: true },
      });
    });

    test('treats now === active_expires as active (no write) — lucia > comparison', async () => {
      mockFindUnique(buildSessionRow(NOW, NOW + IDLE_PERIOD_MS));

      const result = await validateSession(SESSION_ID);

      expect(result).not.toBeNull();
      expect(mockDb.session.update).not.toHaveBeenCalled();
    });
  });

  describe('idle session (active_expires < now <= idle_expires)', () => {
    test('extends both expirations on the same id without deleting', async () => {
      mockFindUnique(buildSessionRow(NOW - 1000, NOW + IDLE_PERIOD_MS));

      const result = await validateSession(SESSION_ID);

      expect(result).not.toBeNull();
      expect(mockDb.session.update).toHaveBeenCalledWith({
        where: { id: SESSION_ID },
        data: {
          active_expires: NOW + ACTIVE_PERIOD_MS,
          idle_expires: NOW + ACTIVE_PERIOD_MS + IDLE_PERIOD_MS,
        },
      });
      expect(mockDb.session.delete).not.toHaveBeenCalled();
    });

    test('treats now === idle_expires as idle (extends) — lucia > comparison', async () => {
      mockFindUnique(buildSessionRow(NOW - IDLE_PERIOD_MS, NOW));

      await validateSession(SESSION_ID);

      expect(mockDb.session.update).toHaveBeenCalledOnce();
    });
  });

  describe('dead session (now > idle_expires)', () => {
    test('returns null and keeps the row (no update, no delete)', async () => {
      mockFindUnique(buildSessionRow(NOW - IDLE_PERIOD_MS - ACTIVE_PERIOD_MS, NOW - 1));

      const result = await validateSession(SESSION_ID);

      expect(result).toBeNull();
      expect(mockDb.session.update).not.toHaveBeenCalled();
      expect(mockDb.session.delete).not.toHaveBeenCalled();
    });
  });

  describe('missing session', () => {
    test('returns null when the row does not exist', async () => {
      mockFindUnique(null);

      expect(await validateSession(SESSION_ID)).toBeNull();
    });
  });
});

describe('invalidateSession', () => {
  test('deletes the session row by id', async () => {
    mockDb.session.delete.mockResolvedValue(buildSessionRow(NOW, NOW));

    await invalidateSession(SESSION_ID);

    expect(mockDb.session.delete).toHaveBeenCalledWith({ where: { id: SESSION_ID } });
  });

  test('swallows P2025 (row already gone) for logout idempotency', async () => {
    const error = buildPrismaError('P2025', 'Record to delete does not exist.');
    mockDb.session.delete.mockRejectedValue(error);

    await expect(invalidateSession(SESSION_ID)).resolves.toBeUndefined();
  });

  test('re-throws Prisma errors other than P2025', async () => {
    const error = buildPrismaError('P2003', 'Foreign key constraint failed.');
    mockDb.session.delete.mockRejectedValue(error);

    await expect(invalidateSession(SESSION_ID)).rejects.toBe(error);
  });
});

describe('SESSION_COOKIE_NAME', () => {
  test('matches the lucia v2 cookie name so existing sessions stay valid', () => {
    expect(SESSION_COOKIE_NAME).toBe('auth_session');
  });
});
