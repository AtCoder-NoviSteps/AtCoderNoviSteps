import { expect, test } from 'vitest';
import { ZodSchema } from 'zod';

import { workBookSchema } from '$lib/zod/schema';
import { WorkBookType, type WorkBookTasks } from '$lib/types/workbook';

type WorkBook = {
  authorId: string;
  title: string;
  description: string;
  editorialUrl: string; // カリキュラムのトピック解説用のURL。HACK: 「ユーザ作成」の場合も利用できるようにするかは要検討。
  isPublished: boolean;
  isOfficial: boolean;
  isReplenished: boolean; // カリキュラムの【補充】を識別するために使用
  workBookType: WorkBookType;
  urlSlug?: string | null; // 問題集（カリキュラムと解法別）をURLで識別するためのオプション。a-z、0-9、(-)ハイフンのみ使用可能。例: bfs、dfs、dp、union-find、2-sat。
  workBookTasks: WorkBookTasks;
};

function createWorkBookBase(overrides: Partial<WorkBook> = {}): WorkBook {
  return {
    authorId: '3',
    title: '実装力を鍛える問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    workBookType: WorkBookType.CREATED_BY_USER,
    workBookTasks: createWorkBookTasks(),
    ...overrides,
  };
}

function createWorkBookTasks(): WorkBookTasks {
  return [{ workBookId: 1, taskId: 'abc322_d', priority: 1, comment: '' }];
}

describe('workbook schema', () => {
  describe('a correct workbook is given', () => {
    test('when a default setting is given', () => {
      const workbook: WorkBook = createWorkBookBase();
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a default settings with an additional description and published is given', () => {
      const workbook: WorkBook = createWorkBookBase({
        description: 'ABCのC〜E問題から出題しています。',
        isPublished: true,
        workBookTasks: [
          { workBookId: 1, taskId: 'abc307_c', priority: 1, comment: '' },
          { workBookId: 2, taskId: 'abc319_c', priority: 2, comment: '' },
          { workBookId: 3, taskId: 'abc322_d', priority: 3, comment: '' },
        ],
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given 200 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        title: 'a'.repeat(200),
        isPublished: true,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a description is given 300 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        description: 'a'.repeat(300),
        isPublished: true,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an editorial url is given 300 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        editorialUrl: 'https://atcoder.jp/' + 'a'.repeat(300 - 'https://atcoder.jp/'.length),
        isPublished: true,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given one character', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: 'a',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given characters and hyphen', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: 'union-find',
        workBookType: WorkBookType.SOLUTION,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given characters, number and hyphens', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: '2-sat',
        workBookType: WorkBookType.SOLUTION,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given 30 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: 'a'.repeat(30),
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given an empty string', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: '',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given null', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: null,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an url slug is given undefined', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: undefined,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks are given 200 tasks', () => {
      const workBookTasks = [];

      for (let index = 1; index <= 200; index++) {
        workBookTasks.push({
          workBookId: index,
          taskId: generateRandomTaskId(),
          priority: index,
          comment: '',
        });
      }

      const workbook: WorkBook = createWorkBookBase({
        isPublished: true,
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a curriculum is given by admin', () => {
      const workBookTasks = [
        { workBookId: 1, taskId: 'joi2022_yo1c_a', priority: 1, comment: '引き算の問題です。' },
        { workBookId: 2, taskId: 'joi2023_yo1a_a', priority: 2, comment: '掛け算の問題です。' },
        { workBookId: 3, taskId: 'joi2024_yo1a_a', priority: 3, comment: '3整数の足し算です。' },
        {
          workBookId: 4,
          taskId: 'joi2024_yo1b_a',
          priority: 4,
          comment: '掛け算と足し算を組合せです。',
        },
        {
          workBookId: 5,
          taskId: 'math_and_algorithm_d',
          priority: 5,
          comment: '3整数の掛け算です。',
        },
        { workBookId: 6, taskId: 'abc134_a', priority: 6, comment: '2乗を言い換えると・・・。' },
      ];
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        title: '10Q 総合問題',
        description:
          'これまでに学んできたことがらを総合的に確認できる問題です。これらの問題のうちのいくつかが解けたら、次のグレード (9Q) に進みましょう！',
        editorialUrl: 'https://atcoder.jp/contests/abc365/editorial/10586',
        isPublished: true,
        isOfficial: true,
        workBookType: WorkBookType.CURRICULUM,
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a replenished curriculum is given', () => {
      const workBookTasks = [
        { workBookId: 1, taskId: 'abc205_a', priority: 1, comment: '' },
        { workBookId: 2, taskId: 'abc202_a', priority: 2, comment: '' },
        { workBookId: 3, taskId: 'abc193_a', priority: 3, comment: '' },
        // 問題数が多いので、途中は省略
        { workBookId: 12, taskId: 'abc045_a', priority: 12, comment: '' },
        { workBookId: 13, taskId: 'abc044_a', priority: 13, comment: '' },
        { workBookId: 14, taskId: 'joi2023_yo1c_a', priority: 14, comment: '' },
      ];
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        title: '9Q 数学',
        description:
          'AtCoder の数学的な問題に苦手意識がある方向けの問題集です。これらの問題を通して、数学の感覚を集中的に磨いていきましょう！',
        isPublished: true,
        isOfficial: true,
        isReplenished: true,
        workBookType: WorkBookType.CURRICULUM,
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a workbook to practice a particular algorithm (WorkBookType.SOLUTION) is given', () => {
      const workBookTasks = [
        {
          workBookId: 1,
          taskId: 'abc007_3',
          priority: 1,
          comment: '人生で最初に解きたい幅優先探索の問題です。',
        },
        // TODO: 実際に問題集が作成されたら、問題を追加する。
      ];
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        title: 'BFS ①',
        description: '幅優先探索（BFS）の基礎的な問題をまとめています。',
        editorialUrl: 'https://drken1215.hatenablog.com/entry/2023/06/11/123536',
        isPublished: true,
        isOfficial: true,
        workBookType: WorkBookType.SOLUTION,
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    function validateWorkBookSchema(schema: ZodSchema<unknown>, workbook: WorkBook) {
      const result = schema.safeParse(workbook);

      expect(result.success).toBeTruthy();
    }
  });

  describe('an incorrect workbook is given', () => {
    test('when an empty title is given', () => {
      const workbook: WorkBook = createWorkBookBase({
        title: '',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given less than two characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        title: '実装',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given more than 200 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        title: 'a'.repeat(201),
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a description is given more than 300 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        description: 'a'.repeat(301),
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an editorial url is given more than 300 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        editorialUrl: 'https://atcoder.jp' + 'a'.repeat(301 - 'https://atcoder.jp'.length),
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid editorial url is given', () => {
      const workbook: WorkBook = createWorkBookBase({
        editorialUrl: 'example.c',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid url slug is given 31 characters', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: 'a'.repeat(31),
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid url slug is given characters and spaces', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: 'directed acyclic graph',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid url slug is given hyphen', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: '-',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid url slug is given hyphens', () => {
      const workbook: WorkBook = createWorkBookBase({
        authorId: '1',
        isPublished: true,
        urlSlug: '--',
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an empty workbook task is given', () => {
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: [],
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks are given more than 200 tasks', () => {
      const workBookTasks = [];

      for (let index = 1; index <= 201; index++) {
        workBookTasks.push({
          workBookId: index,
          taskId: generateRandomTaskId(),
          priority: index,
          comment: '',
        });
      }

      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a negative value is given as the workbook id', () => {
      const workBookTasks = [{ workBookId: -1, taskId: 'abc322_d', priority: 1, comment: '' }];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a negative value is given as the priority', () => {
      const workBookTasks = [{ workBookId: 1, taskId: 'abc322_d', priority: -1, comment: '' }];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when zero is given as the priority', () => {
      const workBookTasks = [{ workBookId: 1, taskId: 'abc322_d', priority: 0, comment: '' }];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a workbook task with a comment more than 50 characters is given', () => {
      const workBookTasks = [
        { workBookId: 1, taskId: 'abc322_d', priority: 1, comment: 'a'.repeat(51) },
      ];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks with at least one of the comments are given more than 50 characters', () => {
      const workBookTasks = [
        { workBookId: 1, taskId: 'abc322_d', priority: 1, comment: '' },
        { workBookId: 2, taskId: 'abc319_c', priority: 2, comment: 'a'.repeat(51) },
        { workBookId: 3, taskId: 'abc322_d', priority: 3, comment: '' },
      ];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks with the all comments are given more than 50 characters', () => {
      const workBookTasks = [
        { workBookId: 1, taskId: 'abc322_d', priority: 1, comment: 'a'.repeat(51) },
        { workBookId: 2, taskId: 'abc319_c', priority: 2, comment: 'a'.repeat(51) },
        { workBookId: 3, taskId: 'abc322_d', priority: 3, comment: 'a'.repeat(51) },
      ];
      const workbook: WorkBook = createWorkBookBase({
        workBookTasks: workBookTasks,
      });
      validateWorkBookSchema(workBookSchema, workbook);
    });

    function validateWorkBookSchema(schema: ZodSchema<unknown>, workbook: WorkBook) {
      const result = schema.safeParse(workbook);

      expect(result.success).toBeFalsy();
    }
  });

  // abcXXX_Y
  function generateRandomTaskId(): string {
    // Note: A random 3-digit number, prefixed with 0 if it is less than or equal to 2 digits.
    const randomNumber = String(Math.floor(Math.random() * 500)).padStart(3, '0');

    const letters = 'abcdefg';
    const randomIndex = Math.floor(Math.random() * letters.length);

    return 'abc' + randomNumber + '_' + letters[randomIndex];
  }
});
