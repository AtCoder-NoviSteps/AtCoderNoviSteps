import { describe, test, expect } from 'vitest';

import { tasks } from '../../../../prisma/tasks';

import { isNoJudgeTask, NO_JUDGE_TASK_URLS } from './no_judge';

describe('isNoJudgeTask', () => {
  test('returns true for task ids starting with NoJudge-', () => {
    expect(isNoJudgeTask('NoJudge-JAGWinter2006-day2_a')).toBe(true);
  });

  test('returns false for AOJ and AtCoder task ids', () => {
    expect(isNoJudgeTask('1123')).toBe(false);
    expect(isNoJudgeTask('abc300_a')).toBe(false);
    expect(isNoJudgeTask('nojudge-JAGWinter2006-day2_a')).toBe(false);
  });
});

describe('NO_JUDGE_TASK_URLS', () => {
  // Expected pages are literals grouped by event, so a task moved to the wrong page fails.
  const expectedPages: [string, string[]][] = [
    [
      'https://jag-icpc.org/?2006%2FPractice%2F%E5%A4%8F%E5%90%88%E5%AE%BF',
      [
        'NoJudge-JAGSummer2006-day1_a',
        'NoJudge-JAGSummer2006-day1_c',
        'NoJudge-JAGSummer2006-day3_a',
      ],
    ],
    [
      'https://jag-icpc.org/?2006%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF',
      [
        'NoJudge-JAGWinter2006-day2_a',
        'NoJudge-JAGWinter2006-day2_b',
        'NoJudge-JAGWinter2006-day2_c',
        'NoJudge-JAGWinter2006-day2_e',
        'NoJudge-JAGWinter2006-day2_g',
        'NoJudge-JAGWinter2006-day2_h',
        'NoJudge-JAGWinter2006-day2_i',
        'NoJudge-JAGWinter2006-day3_b',
        'NoJudge-JAGWinter2006-day3_c',
        'NoJudge-JAGWinter2006-day3_e',
        'NoJudge-JAGWinter2006-day3_f',
        'NoJudge-JAGWinter2006-day3_i',
        'NoJudge-JAGWinter2006-day3_j',
      ],
    ],
    [
      'https://jag-icpc.org/?2007%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF',
      ['NoJudge-JAGWinter2007-day3_e'],
    ],
    [
      'https://jag-icpc.org/?2005%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8',
      ['NoJudge-JAGRegional2005_c', 'NoJudge-JAGRegional2005_f', 'NoJudge-JAGRegional2005_h'],
    ],
    [
      'https://jag-icpc.org/?2008%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8',
      ['NoJudge-JAGRegional2008_j'],
    ],
  ];

  test.each(expectedPages.flatMap(([url, taskIds]) => taskIds.map((taskId) => [taskId, url])))(
    'maps %s to its jag-icpc.org page url verbatim',
    (taskId, url) => {
      expect(NO_JUDGE_TASK_URLS.get(taskId)).toBe(url);
    },
  );

  test('has exactly the 21 expected NoJudge tasks', () => {
    expect(expectedPages.flatMap(([, taskIds]) => taskIds)).toHaveLength(21);
    expect(NO_JUDGE_TASK_URLS.size).toBe(21);
  });

  test('has no entry for AOJ task ids', () => {
    expect(NO_JUDGE_TASK_URLS.has('1123')).toBe(false);
  });

  test('every NoJudge task in prisma/tasks.ts has a page url', () => {
    const missing = tasks
      .filter((task) => isNoJudgeTask(task.id) && !NO_JUDGE_TASK_URLS.has(task.id))
      .map((task) => task.id);

    expect(missing).toEqual([]);
  });

  test('every task id with a page url exists in prisma/tasks.ts', () => {
    const seededIds = new Set(tasks.map((task) => task.id));
    const unknown = [...NO_JUDGE_TASK_URLS.keys()].filter((taskId) => !seededIds.has(taskId));

    expect(unknown).toEqual([]);
  });
});
