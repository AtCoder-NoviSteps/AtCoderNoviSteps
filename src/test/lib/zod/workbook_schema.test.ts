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
  workBookTasks: WorkBookTasks;
};

describe('workbook schema', () => {
  describe('a correct workbook is given', () => {
    test('when a default setting is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a default settings with an additional description and published is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: 'ABCのC〜E問題から出題しています。',
        editorialUrl: '',
        isPublished: true,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc307_c',
            priority: 1,
            comment: '',
          },
          {
            workBookId: 2,
            taskId: 'abc319_c',
            priority: 2,
            comment: '',
          },
          {
            workBookId: 3,
            taskId: 'abc322_d',
            priority: 3,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given 200 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: 'a'.repeat(200),
        description: '',
        editorialUrl: '',
        isPublished: true,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a description is given 300 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: 'a'.repeat(300),
        editorialUrl: '',
        isPublished: true,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an editorial url is given 300 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: 'https://atcoder.jp/' + 'a'.repeat(300 - 'https://atcoder.jp/'.length),
        isPublished: true,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
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

      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: workBookTasks,
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a curriculum is given by admin', () => {
      const workbook: WorkBook = {
        authorId: '1',
        title: '10Q 総合問題',
        description:
          'これまでに学んできたことがらを総合的に確認できる問題です。これらの問題のうちのいくつかが解けたら、次のグレード (9Q) に進みましょう！',
        editorialUrl: 'https://atcoder.jp/contests/abc365/editorial/10586',
        isPublished: true,
        isOfficial: true,
        isReplenished: false,
        workBookType: WorkBookType.TEXTBOOK,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'joi2022_yo1c_a',
            priority: 1,
            comment: '引き算の問題です。',
          },
          {
            workBookId: 2,
            taskId: 'joi2023_yo1a_a',
            priority: 2,
            comment: '掛け算の問題です。',
          },
          {
            workBookId: 3,
            taskId: 'joi2024_yo1a_a',
            priority: 3,
            comment: '3つの整数の足し算です。',
          },
          {
            workBookId: 4,
            taskId: 'joi2024_yo1b_a',
            priority: 4,
            comment: '掛け算と足し算を組み合わせた問題です。',
          },
          {
            workBookId: 5,
            taskId: 'math_and_algorithm_d',
            priority: 5,
            comment: '3つの整数の掛け算です。',
          },
          {
            workBookId: 6,
            taskId: 'abc134_a',
            priority: 6,
            comment: '2乗を言い換えると・・・。',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a replenished curriculum is given', () => {
      const workbook: WorkBook = {
        authorId: '1',
        title: '9Q 数学',
        description:
          'AtCoder の数学的な問題に苦手意識がある方向けの問題集です。これらの問題を通して、数学の感覚を集中的に磨いていきましょう！',
        editorialUrl: '',
        isPublished: true,
        isOfficial: true,
        isReplenished: true,
        workBookType: WorkBookType.TEXTBOOK,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc205_a',
            priority: 1,
            comment: '',
          },
          {
            workBookId: 2,
            taskId: 'abc202_a',
            priority: 2,
            comment: '',
          },
          {
            workBookId: 3,
            taskId: 'abc193_a',
            priority: 3,
            comment: '',
          },
          // 問題数が多いので、途中は省略
          {
            workBookId: 12,
            taskId: 'abc045_a',
            priority: 12,
            comment: '',
          },
          {
            workBookId: 13,
            taskId: 'abc044_a',
            priority: 13,
            comment: '',
          },
          {
            workBookId: 14,
            taskId: 'joi2023_yo1c_a',
            priority: 14,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a workbook to practice a particular algorithm (WorkBookType.SOLUTION) is given', () => {
      const workbook: WorkBook = {
        authorId: '1',
        title: 'BFS ①',
        description: '幅優先探索（BFS）の基礎的な問題をまとめています。',
        editorialUrl: 'https://drken1215.hatenablog.com/entry/2023/06/11/123536',
        isPublished: true,
        isOfficial: true,
        isReplenished: false,
        workBookType: WorkBookType.SOLUTION,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc007_3',
            priority: 1,
            comment: '人生で最初に解きたい幅優先探索の問題です。',
          },
          // TODO: 実際に問題集が作成されたら、問題を追加する。
        ],
      };

      validateWorkBookSchema(workBookSchema, workbook);
    });

    function validateWorkBookSchema(schema: ZodSchema<unknown>, workbook: WorkBook) {
      const result = schema.safeParse(workbook);

      expect(result.success).toBeTruthy();
    }
  });

  describe('an incorrect workbook is given', () => {
    test('when an empty title is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given less than two characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a title is given more than 200 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: 'a'.repeat(201),
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a description is given more than 300 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: 'a'.repeat(301),
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an editorial url is given more than 300 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: 'https://atcoder.jp' + 'a'.repeat(301 - 'https://atcoder.jp'.length),
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an invalid editorial url is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: 'example.c',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when an empty workbook task is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [],
      };
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

      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: workBookTasks,
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a negative value is given as the workbook id', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: -1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a negative value is given as the priority', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: -1,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when zero is given as the priority', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 0,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when a workbook task with a comment more than 50 characters is given', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: 'a'.repeat(51),
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks with at least one of the comments are given more than 50 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: '',
          },
          {
            workBookId: 2,
            taskId: 'abc319_c',
            priority: 2,
            comment: 'a'.repeat(51),
          },
          {
            workBookId: 3,
            taskId: 'abc322_d',
            priority: 3,
            comment: '',
          },
        ],
      };
      validateWorkBookSchema(workBookSchema, workbook);
    });

    test('when workbook tasks with the all comments are given more than 50 characters', () => {
      const workbook: WorkBook = {
        authorId: '3',
        title: '実装力を鍛える問題集',
        description: '',
        editorialUrl: '',
        isPublished: false,
        isOfficial: false,
        isReplenished: false,
        workBookType: WorkBookType.CREATED_BY_USER,
        workBookTasks: [
          {
            workBookId: 1,
            taskId: 'abc322_d',
            priority: 1,
            comment: 'a'.repeat(51),
          },
          {
            workBookId: 2,
            taskId: 'abc319_c',
            priority: 2,
            comment: 'a'.repeat(51),
          },
          {
            workBookId: 3,
            taskId: 'abc322_d',
            priority: 3,
            comment: 'a'.repeat(51),
          },
        ],
      };
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
