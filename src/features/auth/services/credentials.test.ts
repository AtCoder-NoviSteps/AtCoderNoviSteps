import { describe, test, expect, beforeEach, vi } from 'vitest';

import { Prisma } from '@prisma/client';

vi.mock('$lib/server/database', () => ({
  default: {
    $transaction: vi.fn(),
    user: {
      create: vi.fn(),
    },
    key: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('$lib/server/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import db from '$lib/server/database';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { registerUser, authenticateUser } from './credentials';

const mockDb = db as unknown as {
  $transaction: ReturnType<typeof vi.fn>;
  user: { create: ReturnType<typeof vi.fn> };
  key: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
};

const mockHashPassword = hashPassword as unknown as ReturnType<typeof vi.fn>;
const mockVerifyPassword = verifyPassword as unknown as ReturnType<typeof vi.fn>;

// realistic values: mixed-case username so the lowercased key id is exercised
const USERNAME = 'Chokudai';
const KEY_ID = 'username:chokudai';
const PASSWORD = 'Ch0kuda1';
const HASHED_PASSWORD = 's2:0123456789abcdef:' + 'a'.repeat(128);

const buildPrismaError = (code: string, message: string) =>
  new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: '5.0.0' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  describe('successful case', () => {
    test('creates the user and key in a single transaction and returns the new user id', async () => {
      mockHashPassword.mockResolvedValue(HASHED_PASSWORD);
      mockDb.$transaction.mockResolvedValue([]);

      const result = await registerUser(USERNAME, PASSWORD);

      // user id is a lucia v2 compatible 15-char [a-z0-9] random string
      expect(result).not.toBeNull();
      const userId = result!.userId;
      expect(userId).toMatch(/^[a-z0-9]{15}$/);

      // the same generated id is used for the user row and the key's user_id
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: { id: userId, username: USERNAME },
      });
      expect(mockDb.key.create).toHaveBeenCalledWith({
        data: { id: KEY_ID, user_id: userId, hashed_password: HASHED_PASSWORD },
      });

      // both writes run atomically via $transaction
      expect(mockDb.$transaction).toHaveBeenCalledOnce();
    });

    test('lowercases the username for the key id but keeps the original case for the user row', async () => {
      mockHashPassword.mockResolvedValue(HASHED_PASSWORD);
      mockDb.$transaction.mockResolvedValue([]);

      await registerUser(USERNAME, PASSWORD);

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ username: USERNAME }),
      });
      expect(mockDb.key.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ id: KEY_ID }),
      });
    });
  });

  describe('error cases', () => {
    test('returns null when the username is already taken (P2002)', async () => {
      mockHashPassword.mockResolvedValue(HASHED_PASSWORD);
      mockDb.$transaction.mockRejectedValue(
        buildPrismaError('P2002', 'Unique constraint failed on the fields: (`username`)'),
      );

      expect(await registerUser(USERNAME, PASSWORD)).toBeNull();
    });

    test('re-throws Prisma errors other than P2002', async () => {
      mockHashPassword.mockResolvedValue(HASHED_PASSWORD);
      const error = buildPrismaError('P2003', 'Foreign key constraint failed.');
      mockDb.$transaction.mockRejectedValue(error);

      await expect(registerUser(USERNAME, PASSWORD)).rejects.toBe(error);
    });
  });
});

describe('authenticateUser', () => {
  describe('successful case', () => {
    test('returns the user id when the key exists and the password verifies', async () => {
      mockDb.key.findUnique.mockResolvedValue({
        id: KEY_ID,
        user_id: 'abcdefghij12345',
        hashed_password: HASHED_PASSWORD,
      });
      mockVerifyPassword.mockResolvedValue(true);

      const result = await authenticateUser(USERNAME, PASSWORD);

      expect(result).toEqual({ userId: 'abcdefghij12345' });
      expect(mockDb.key.findUnique).toHaveBeenCalledWith({ where: { id: KEY_ID } });
      expect(mockVerifyPassword).toHaveBeenCalledWith(PASSWORD, HASHED_PASSWORD);
    });
  });

  describe('error cases', () => {
    test('returns null when no key exists for the username (does not check the password)', async () => {
      mockDb.key.findUnique.mockResolvedValue(null);

      expect(await authenticateUser(USERNAME, PASSWORD)).toBeNull();
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    test('returns null when the key has no hashed_password (does not check the password)', async () => {
      mockDb.key.findUnique.mockResolvedValue({
        id: KEY_ID,
        user_id: 'abcdefghij12345',
        hashed_password: null,
      });

      expect(await authenticateUser(USERNAME, PASSWORD)).toBeNull();
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    test('returns null when the password does not match', async () => {
      mockDb.key.findUnique.mockResolvedValue({
        id: KEY_ID,
        user_id: 'abcdefghij12345',
        hashed_password: HASHED_PASSWORD,
      });
      mockVerifyPassword.mockResolvedValue(false);

      expect(await authenticateUser(USERNAME, PASSWORD)).toBeNull();
    });
  });
});
