import { describe, test, expect, vi, beforeEach } from 'vitest';

import { WorkBookType, type WorkBook } from '$features/workbooks/types/workbook';

import {
  getWorkBook,
  getWorkBooksWithAuthors,
  getWorkbookWithAuthor,
  createWorkBook,
  updateWorkBook,
  deleteWorkBook,
  getPublishedWorkbooksByPlacement,
  getWorkBooksCreatedByUsers,
  getAvailableSolutionCategories,
} from './workbooks';
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

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
    workBookPlacement: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('$lib/services/users', () => ({
  getUserById: vi.fn(),
}));

import prisma from '$lib/server/database';
import * as usersCrud from '$lib/services/users';

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

function mockFindUnique(value: PrismaWorkBook) {
  vi.mocked(prisma.workBook.findUnique).mockResolvedValue(value);
}

function mockFindMany(value: PrismaWorkBookWithUser[]) {
  vi.mocked(prisma.workBook.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.workBook.findMany>>,
  );
}

function mockCount(value: number) {
  vi.mocked(prisma.workBook.count).mockResolvedValue(value);
}

function mockCreate(value: NonNullable<PrismaWorkBook>) {
  vi.mocked(prisma.workBook.create).mockResolvedValue(value);
}

function mockTransaction(value: unknown[] = []) {
  vi.mocked(prisma.$transaction).mockResolvedValue(value);
}

function mockDelete(value: NonNullable<PrismaWorkBook>) {
  vi.mocked(prisma.workBook.delete).mockResolvedValue(value);
}

describe('getWorkBook', () => {
  test('returns workbook when found', async () => {
    const workBook = prepareWorkBook({ id: 42 });
    mockFindUnique(asPrismaWorkBook(workBook));

    const result = await getWorkBook(42);

    expect(result).toMatchObject({ id: 42 });
    expect(prisma.workBook.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
  });

  test('returns null when not found', async () => {
    mockFindUnique(null);

    const result = await getWorkBook(999);

    expect(result).toBeNull();
  });
});

describe('getWorkBooksWithAuthors', () => {
  test('maps username to authorName', async () => {
    const workBook = prepareWorkBook({ id: 1 });
    mockFindMany([asPrismaWorkBookWithUser(workBook, { username: 'alice' })]);

    const result = await getWorkBooksWithAuthors();

    expect(result[0].authorName).toBe('alice');
  });

  test('uses "unknown" as authorName when author is deleted', async () => {
    const workBook = prepareWorkBook({ id: 2 });
    mockFindMany([asPrismaWorkBookWithUser(workBook, null)]);

    const result = await getWorkBooksWithAuthors();

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('getWorkbookWithAuthor', () => {
  function mockGetUserById(value: { id: string } | null) {
    vi.mocked(usersCrud.getUserById).mockResolvedValue(value as never);
  }

  test('returns null when workbook is not found', async () => {
    mockFindUnique(null);

    const result = await getWorkbookWithAuthor('999');

    expect(result).toBeNull();
  });

  test('returns workbook with isExistingAuthor true when author exists', async () => {
    const workBook = prepareWorkBook({ id: 1, authorId: '1' });
    mockFindUnique(asPrismaWorkBook(workBook));
    mockGetUserById({ id: '1' });

    const result = await getWorkbookWithAuthor('1');

    expect(result).not.toBeNull();
    expect(result!.workBook).toMatchObject({ id: 1 });
    expect(result!.isExistingAuthor).toBe(true);
  });

  test('returns workbook with isExistingAuthor false when author is deleted', async () => {
    const workBook = prepareWorkBook({ id: 1, authorId: '1' });
    mockFindUnique(asPrismaWorkBook(workBook));
    mockGetUserById(null);

    const result = await getWorkbookWithAuthor('1');

    expect(result).not.toBeNull();
    expect(result!.isExistingAuthor).toBe(false);
  });
});

describe('createWorkBook', () => {
  test('creates workbook successfully', async () => {
    const workBook = prepareWorkBook({ urlSlug: null });
    mockFindUnique(null); // slug not taken
    mockCreate(asPrismaWorkBook(workBook) as NonNullable<PrismaWorkBook>);

    await expect(createWorkBook(workBook)).resolves.toBeUndefined();
    expect(prisma.workBook.create).toHaveBeenCalledTimes(1);
  });

  test('throws when urlSlug is already in use', async () => {
    const workBook = prepareWorkBook({ urlSlug: 'bfs' });
    mockFindUnique(
      asPrismaWorkBook(prepareWorkBook({ urlSlug: 'bfs' })) as NonNullable<PrismaWorkBook>,
    );

    await expect(createWorkBook(workBook)).rejects.toThrow('bfs');
    expect(prisma.workBook.create).not.toHaveBeenCalled();
  });
});

describe('updateWorkBook', () => {
  test('updates workbook successfully', async () => {
    const workBook = prepareWorkBook({ id: 1 });
    mockCount(1);
    mockTransaction();

    await expect(updateWorkBook(1, workBook)).resolves.toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('throws when workbook id does not exist', async () => {
    mockCount(0);

    await expect(updateWorkBook(999, prepareWorkBook({ id: 999 }))).rejects.toThrow('999');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('deleteWorkBook', () => {
  test('deletes workbook successfully', async () => {
    mockCount(1);
    mockDelete(asPrismaWorkBook(prepareWorkBook()) as NonNullable<PrismaWorkBook>);

    await expect(deleteWorkBook(1)).resolves.toBeUndefined();
    expect(prisma.workBook.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  test('throws when workbook id does not exist', async () => {
    mockCount(0);

    await expect(deleteWorkBook(999)).rejects.toThrow('999');
    expect(prisma.workBook.delete).not.toHaveBeenCalled();
  });
});

const MOCK_WORKBOOK_BASE = {
  id: 1,
  title: 'Test workbook',
  isPublished: true,
  isReplenished: false,
  isOfficial: true,
  authorId: 'user1',
  description: '',
  editorialUrl: '',
  urlSlug: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  workBookTasks: [],
  user: { username: 'author1' },
};

/** Sets up prisma.workBook.findMany to resolve with the given workbooks. */
function mockWorkbookFindMany(workbooks: object[]) {
  vi.mocked(prisma.workBook.findMany).mockResolvedValue(
    workbooks as unknown as Awaited<ReturnType<typeof prisma.workBook.findMany>>,
  );
}

describe('getPublishedWorkbooksByPlacement', () => {
  test('filters CURRICULUM workbooks by taskGrade with priority asc order', async () => {
    mockWorkbookFindMany([{ ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CURRICULUM }]);

    const result = await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.CURRICULUM,
      taskGrade: TaskGrade.Q10,
    });

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBookType: WorkBookType.CURRICULUM,
          isPublished: true,
          placement: { taskGrade: TaskGrade.Q10 },
        }),
        orderBy: { placement: { priority: 'asc' } },
      }),
    );
    expect(result[0].authorName).toBe('author1');
  });

  test('filters SOLUTION workbooks by solutionCategory', async () => {
    mockWorkbookFindMany([{ ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.SOLUTION }]);

    await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.SOLUTION,
      solutionCategory: SolutionCategory.GRAPH,
    });

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBookType: WorkBookType.SOLUTION,
          placement: { solutionCategory: SolutionCategory.GRAPH },
        }),
      }),
    );
  });

  test('maps null user to authorName "unknown"', async () => {
    mockWorkbookFindMany([
      { ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CURRICULUM, user: null },
    ]);

    const result = await getPublishedWorkbooksByPlacement({
      workBookType: WorkBookType.CURRICULUM,
      taskGrade: TaskGrade.Q10,
    });

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('getWorkBooksCreatedByUsers', () => {
  test('queries only CREATED_BY_USER type workbooks ordered by id asc', async () => {
    mockWorkbookFindMany([{ ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CREATED_BY_USER }]);

    await getWorkBooksCreatedByUsers();

    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workBookType: WorkBookType.CREATED_BY_USER },
        orderBy: { id: 'asc' },
      }),
    );
  });

  test('maps null user to authorName "unknown"', async () => {
    mockWorkbookFindMany([
      { ...MOCK_WORKBOOK_BASE, workBookType: WorkBookType.CREATED_BY_USER, user: null },
    ]);

    const result = await getWorkBooksCreatedByUsers();

    expect(result[0].authorName).toBe('unknown');
  });
});

describe('getAvailableSolutionCategories', () => {
  test('returns distinct non-null solutionCategory values', async () => {
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue([
      { solutionCategory: SolutionCategory.GRAPH },
      { solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING },
    ] as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>);

    const result = await getAvailableSolutionCategories();

    expect(result).toEqual([SolutionCategory.GRAPH, SolutionCategory.DYNAMIC_PROGRAMMING]);
  });

  test('excludes null solutionCategory entries', async () => {
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue([
      { solutionCategory: SolutionCategory.GRAPH },
      { solutionCategory: null },
    ] as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>);

    const result = await getAvailableSolutionCategories();

    expect(result).toEqual([SolutionCategory.GRAPH]);
  });
});
