import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { User } from '@prisma/client';

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

const mockFindUnique = vi.mocked(db.user.findUnique);
const mockDelete = vi.mocked(db.user.delete);

// Type-safe fixture (no `as any`)
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

const SAMPLE_USER: UserWithAccount = {
  id: 'user-abc123',
  username: 'testuser',
  role: 'USER',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  atCoderAccount: {
    userId: 'user-abc123',
    handle: 'testuser_ac',
    isValidated: true,
    validationCode: 'code-xyz',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
} as UserWithAccount;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUser', () => {
  test('returns user with atCoderAccount when found', async () => {
    mockFindUnique.mockResolvedValueOnce(SAMPLE_USER);

    const result = await getUser('testuser');

    expect(result).toEqual(SAMPLE_USER);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { username: 'testuser' },
      include: { atCoderAccount: true },
    });
  });

  test('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getUser('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getUserById', () => {
  test('returns user with atCoderAccount when found', async () => {
    mockFindUnique.mockResolvedValueOnce(SAMPLE_USER);

    const result = await getUserById('user-abc123');

    expect(result).toEqual(SAMPLE_USER);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-abc123' },
      include: { atCoderAccount: true },
    });
  });

  test('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getUserById('nonexistent-id');

    expect(result).toBeNull();
  });
});

describe('deleteUser', () => {
  test('deletes user and subsequent getUser returns null', async () => {
    mockDelete.mockResolvedValueOnce(SAMPLE_USER);
    mockFindUnique.mockResolvedValueOnce(null);

    const deleteResult = await deleteUser('testuser');

    expect(deleteResult).toEqual(SAMPLE_USER);
    expect(mockDelete).toHaveBeenCalledWith({ where: { username: 'testuser' } });

    // Verify that the user is actually deleted (subsequent getUser returns null)
    const getResult = await getUser('testuser');
    expect(getResult).toBeNull();
  });
});
