import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Roles, type User } from '@prisma/client';

vi.mock('$lib/server/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import db from '$lib/server/database';
import { getUser, getUserById, deleteUser } from '$lib/services/users';

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type UserWithAccount = User & {
  atCoderAccount: {
    userId: string;
    handle: string;
    isValidated: boolean;
    validationCode: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_TIMESTAMP = new Date('2024-01-01');
const SAMPLE_USER_ID = 'user-abc123';
const SAMPLE_USERNAME = 'testuser';
const SAMPLE_HANDLE = 'testuser_ac';

function prepareUser(overrides: Partial<UserWithAccount> = {}): UserWithAccount {
  return {
    id: SAMPLE_USER_ID,
    username: SAMPLE_USERNAME,
    role: Roles.USER,
    created_at: SAMPLE_TIMESTAMP,
    updated_at: SAMPLE_TIMESTAMP,
    atCoderAccount: {
      userId: SAMPLE_USER_ID,
      handle: SAMPLE_HANDLE,
      isValidated: true,
      validationCode: 'code-xyz',
      createdAt: SAMPLE_TIMESTAMP,
      updatedAt: SAMPLE_TIMESTAMP,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockFindUnique(value: UserWithAccount | null): void {
  vi.mocked(db.user.findUnique).mockResolvedValueOnce(value);
}

function mockDelete(value: UserWithAccount): void {
  vi.mocked(db.user.delete).mockResolvedValueOnce(value);
}

function mockDeleteError(message: string = 'not found'): void {
  vi.mocked(db.user.delete).mockRejectedValueOnce(new Error(message));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUser', () => {
  describe('successful case', () => {
    test('returns user with atCoderAccount when found', async () => {
      mockFindUnique(prepareUser());

      const result = await getUser(SAMPLE_USERNAME);

      expect(result).toEqual(prepareUser());
      expect(vi.mocked(db.user.findUnique)).toHaveBeenCalledWith({
        where: { username: SAMPLE_USERNAME },
        include: { atCoderAccount: true },
      });
    });
  });

  describe('error cases', () => {
    test('returns null when user is not found', async () => {
      mockFindUnique(null);

      const result = await getUser('nonexistent');

      expect(result).toBeNull();
    });
  });
});

describe('getUserById', () => {
  describe('successful case', () => {
    test('returns user with atCoderAccount when found', async () => {
      mockFindUnique(prepareUser());

      const result = await getUserById(SAMPLE_USER_ID);

      expect(result).toEqual(prepareUser());
      expect(vi.mocked(db.user.findUnique)).toHaveBeenCalledWith({
        where: { id: SAMPLE_USER_ID },
        include: { atCoderAccount: true },
      });
    });
  });

  describe('error cases', () => {
    test('returns null when user is not found', async () => {
      mockFindUnique(null);

      const result = await getUserById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});

describe('deleteUser', () => {
  describe('successful case', () => {
    test('deletes user and returns deleted user; subsequent getUser returns null', async () => {
      mockDelete(prepareUser());
      mockFindUnique(null); // Subsequent getUser should not find the deleted user

      const deleteResult = await deleteUser(SAMPLE_USERNAME);
      const userAfterDelete = await getUser(SAMPLE_USERNAME);

      expect(deleteResult).toEqual(prepareUser());
      expect(userAfterDelete).toBeNull();
      expect(vi.mocked(db.user.delete)).toHaveBeenCalledWith({
        where: { username: SAMPLE_USERNAME },
      });
    });
  });

  describe('error cases', () => {
    test('throws when user not found', async () => {
      mockDeleteError('User not found');

      await expect(deleteUser(SAMPLE_USERNAME)).rejects.toThrow();
    });
  });
});
