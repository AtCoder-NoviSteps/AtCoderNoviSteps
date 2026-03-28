import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$lib/server/database', () => ({
  default: {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    atCoderAccount: {
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('$lib/utils/hash', () => ({
  sha256: vi.fn().mockResolvedValue('mocked-hash'),
}));

import prisma from '$lib/server/database';
import { generate, validate, reset } from './atcoder_verification';

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type PrismaUserWithAccount = Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>> & {
  atCoderAccount: {
    userId: string;
    handle: string;
    isValidated: boolean;
    validationCode: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_TIMESTAMP = new Date('2024-01-01T00:00:00Z');
const SAMPLE_USER_ID = 'user-1';
const SAMPLE_USERNAME = 'alice';
const SAMPLE_HANDLE = 'alice_ac';
const SAMPLE_VALIDATION_CODE = 'mocked-hash';
const SAMPLE_API_URL = 'https://example.com/api';

function makeUser(
  atCoderAccount: PrismaUserWithAccount['atCoderAccount'] = null,
): PrismaUserWithAccount {
  return {
    id: SAMPLE_USER_ID,
    username: SAMPLE_USERNAME,
    role: 'USER',
    created_at: SAMPLE_TIMESTAMP,
    updated_at: SAMPLE_TIMESTAMP,
    atCoderAccount,
  } as unknown as PrismaUserWithAccount;
}

function makeAtCoderAccount(
  overrides: Partial<NonNullable<PrismaUserWithAccount['atCoderAccount']>> = {},
): NonNullable<PrismaUserWithAccount['atCoderAccount']> {
  return {
    userId: SAMPLE_USER_ID,
    handle: SAMPLE_HANDLE,
    isValidated: false,
    validationCode: SAMPLE_VALIDATION_CODE,
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockFindUniqueOrThrow(value: PrismaUserWithAccount) {
  vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(
    value as Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>,
  );
}

function mockFetch(body: unknown, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: vi.fn().mockResolvedValue(body),
    }),
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CONFIRM_API_URL = SAMPLE_API_URL;
});

afterEach(() => {
  delete process.env.CONFIRM_API_URL;
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generate', () => {
  test('returns the sha256 validation code', async () => {
    mockFindUniqueOrThrow(makeUser());
    vi.mocked(prisma.atCoderAccount.upsert).mockResolvedValue({} as never);

    const result = await generate(SAMPLE_USERNAME, SAMPLE_HANDLE);

    expect(result).toBe(SAMPLE_VALIDATION_CODE);
  });

  test('calls upsert with correct create and update payloads', async () => {
    mockFindUniqueOrThrow(makeUser());
    vi.mocked(prisma.atCoderAccount.upsert).mockResolvedValue({} as never);

    await generate(SAMPLE_USERNAME, SAMPLE_HANDLE);

    expect(prisma.atCoderAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: SAMPLE_USER_ID },
        create: expect.objectContaining({
          userId: SAMPLE_USER_ID,
          handle: SAMPLE_HANDLE,
          validationCode: SAMPLE_VALIDATION_CODE,
          isValidated: false,
        }),
        update: expect.objectContaining({
          handle: SAMPLE_HANDLE,
          validationCode: SAMPLE_VALIDATION_CODE,
          isValidated: false,
        }),
      }),
    );
  });
});

describe('validate', () => {
  test('returns false when user has no AtCoderAccount', async () => {
    mockFindUniqueOrThrow(makeUser(null));

    const result = await validate(SAMPLE_USERNAME);

    expect(result).toBe(false);
  });

  test('returns false when validationCode is empty', async () => {
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount({ validationCode: '' })));

    const result = await validate(SAMPLE_USERNAME);

    expect(result).toBe(false);
  });

  test('returns false when the external API does not confirm the code', async () => {
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount()));
    mockFetch({ contents: ['other-code'] });

    const result = await validate(SAMPLE_USERNAME);

    expect(result).toBe(false);
    expect(prisma.atCoderAccount.update).not.toHaveBeenCalled();
  });

  test('returns true and marks account as validated when the external API confirms the code', async () => {
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount()));
    mockFetch({ contents: [SAMPLE_VALIDATION_CODE] });
    vi.mocked(prisma.atCoderAccount.update).mockResolvedValue({} as never);

    const result = await validate(SAMPLE_USERNAME);

    expect(result).toBe(true);
    expect(prisma.atCoderAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: SAMPLE_USER_ID },
        data: { validationCode: '', isValidated: true },
      }),
    );
  });

  test('throws when the external API returns non-OK response', async () => {
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount()));
    mockFetch({}, false);

    await expect(validate(SAMPLE_USERNAME)).rejects.toThrow();
  });

  test('returns false when the external API returns invalid JSON', async () => {
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount()));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      }),
    );

    const result = await validate(SAMPLE_USERNAME);

    expect(result).toBe(false);
  });

  test('throws when CONFIRM_API_URL is not set', async () => {
    delete process.env.CONFIRM_API_URL;
    mockFindUniqueOrThrow(makeUser(makeAtCoderAccount()));

    await expect(validate(SAMPLE_USERNAME)).rejects.toThrow('CONFIRM_API_URL is not set.');
  });
});

describe('reset', () => {
  test('calls deleteMany with the correct userId (deleteMany is intentional: tolerates missing record)', async () => {
    mockFindUniqueOrThrow(makeUser());
    vi.mocked(prisma.atCoderAccount.deleteMany).mockResolvedValue({ count: 1 });

    await reset(SAMPLE_USERNAME);

    expect(prisma.atCoderAccount.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: SAMPLE_USER_ID },
      }),
    );
  });
});
