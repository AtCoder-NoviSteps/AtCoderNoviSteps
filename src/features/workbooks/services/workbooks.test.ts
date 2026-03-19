import { describe, test, expect, vi, beforeEach } from 'vitest';

import { WorkBookType, type WorkBook } from '$features/workbooks/types/workbook';

import {
  getWorkBook,
  getWorkBooksWithAuthors,
  createWorkBook,
  updateWorkBook,
  deleteWorkBook,
} from './workbooks';

vi.mock('$lib/server/database', () => ({
  default: {
    workBook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workBookTask: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('$lib/services/users', () => ({
  getUserById: vi.fn(),
}));

import prisma from '$lib/server/database';

beforeEach(() => {
  vi.clearAllMocks();
});

function prepareWorkBook(overrides: Partial<WorkBook> = {}): WorkBook {
  return {
    id: 1,
    authorId: '1',
    title: 'テスト問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    workBookType: WorkBookType.CURRICULUM,
    urlSlug: null,
    workBookTasks: [],
    ...overrides,
  };
}

type PrismaWorkBook = Awaited<ReturnType<typeof prisma.workBook.findUnique>>;
type PrismaWorkBookWithUser = Awaited<ReturnType<typeof prisma.workBook.findMany>>[number] & {
  user: { username: string } | null;
};

function asPrismaWorkBook(workBook: WorkBook): PrismaWorkBook {
  return workBook as unknown as PrismaWorkBook;
}

function asPrismaWorkBookWithUser(
  workBook: WorkBook,
  user: { username: string } | null,
): PrismaWorkBookWithUser {
  return { ...workBook, user } as unknown as PrismaWorkBookWithUser;
}

describe('getWorkBook', () => {
  test('returns workbook when found', async () => {
    const workBook = prepareWorkBook({ id: 42 });
    vi.mocked(prisma.workBook.findUnique).mockResolvedValue(asPrismaWorkBook(workBook));

    const result = await getWorkBook(42);

    expect(result).toMatchObject({ id: 42 });
    expect(prisma.workBook.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
  });

  test('returns null when not found', async () => {
    vi.mocked(prisma.workBook.findUnique).mockResolvedValue(null);

    const result = await getWorkBook(999);

    expect(result).toBeNull();
  });
});

describe('getWorkBooksWithAuthors', () => {
  test('maps username to authorName', async () => {
    const workBook = prepareWorkBook({ id: 1 });
    vi.mocked(prisma.workBook.findMany).mockResolvedValue([
      asPrismaWorkBookWithUser(workBook, { username: 'alice' }),
    ] as Awaited<ReturnType<typeof prisma.workBook.findMany>>);

    const result = await getWorkBooksWithAuthors();

    expect(result[0].authorName).toBe('alice');
  });

  test('uses "unknown" as authorName when author is deleted', async () => {
    const workBook = prepareWorkBook({ id: 2 });
    vi.mocked(prisma.workBook.findMany).mockResolvedValue([
      asPrismaWorkBookWithUser(workBook, null),
    ] as Awaited<ReturnType<typeof prisma.workBook.findMany>>);

    const result = await getWorkBooksWithAuthors();

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('createWorkBook', () => {
  test('creates workbook successfully', async () => {
    const workBook = prepareWorkBook({ urlSlug: null });
    vi.mocked(prisma.workBook.findUnique).mockResolvedValue(null); // slug not taken
    vi.mocked(prisma.workBook.create).mockResolvedValue(
      asPrismaWorkBook(workBook) as NonNullable<PrismaWorkBook>,
    );

    await expect(createWorkBook(workBook)).resolves.toBeUndefined();
    expect(prisma.workBook.create).toHaveBeenCalledTimes(1);
  });

  test('throws when urlSlug is already in use', async () => {
    const workBook = prepareWorkBook({ urlSlug: 'bfs' });
    vi.mocked(prisma.workBook.findUnique).mockResolvedValue(
      asPrismaWorkBook(prepareWorkBook({ urlSlug: 'bfs' })) as NonNullable<PrismaWorkBook>,
    );

    await expect(createWorkBook(workBook)).rejects.toThrow('bfs');
    expect(prisma.workBook.create).not.toHaveBeenCalled();
  });
});

describe('updateWorkBook', () => {
  test('updates workbook successfully', async () => {
    const workBook = prepareWorkBook({ id: 1 });
    vi.mocked(prisma.workBook.count).mockResolvedValue(1);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    await expect(updateWorkBook(1, workBook)).resolves.toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('throws when workbook id does not exist', async () => {
    vi.mocked(prisma.workBook.count).mockResolvedValue(0);

    await expect(updateWorkBook(999, prepareWorkBook({ id: 999 }))).rejects.toThrow('999');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('deleteWorkBook', () => {
  test('deletes workbook successfully', async () => {
    vi.mocked(prisma.workBook.count).mockResolvedValue(1);
    vi.mocked(prisma.workBook.delete).mockResolvedValue(
      asPrismaWorkBook(prepareWorkBook()) as NonNullable<PrismaWorkBook>,
    );

    await expect(deleteWorkBook(1)).resolves.toBeUndefined();
    expect(prisma.workBook.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  test('throws when workbook id does not exist', async () => {
    vi.mocked(prisma.workBook.count).mockResolvedValue(0);

    await expect(deleteWorkBook(999)).rejects.toThrow('999');
    expect(prisma.workBook.delete).not.toHaveBeenCalled();
  });
});
