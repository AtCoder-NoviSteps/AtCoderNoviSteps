/**
 * TODO: Vitest v4.x Upgrade
 * With Vitest v4.x, the vi.mock() factory hoisting constraints may be relaxed.
 * When upgrading to v4.x, consider:
 * 1. Moving hardcoded mock data inside factories to imports from fixtures
 * 2. Or leverage improved vi.hoisted() capabilities
 * 3. Review setupFiles option for centralized mock configuration
 *
 * Current implementation (v3.x) requires hardcoding within factories due to hoisting.
 * See comments below marked with "Note: Mock data corresponds to fixtures".
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

import { getTaskResults } from '$lib/services/task_results';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  MOCK_TASKS_DATA,
  MOCK_ANSWERS_WITH_ANSWERS,
  EXPECTED_STATUSES,
} from './fixtures/task_results';

// Mock dependencies
// Note: Vitest's vi.mock() factory functions are hoisted before module initialization,
// so we cannot import constants from fixtures directly. However, the mock data below
// corresponds to MOCK_SUBMISSION_STATUSES_DATA in ./fixtures/task_results.ts
vi.mock('$lib/server/database', () => ({
  default: {},
}));

vi.mock('$lib/services/submission_status', () => ({
  getSubmissionStatusMapWithId: vi.fn().mockResolvedValue(
    new Map([
      [
        '1',
        {
          id: '1',
          status_name: 'ac',
          image_path: 'ac.png',
          label_name: 'AC',
          is_ac: true,
        },
      ],
      [
        '2',
        {
          id: '2',
          status_name: 'ac_with_editorial',
          image_path: 'ac_with_editorial.png',
          label_name: '解説AC',
          is_ac: true,
        },
      ],
      [
        '3',
        {
          id: '3',
          status_name: 'wa',
          image_path: 'wa.png',
          label_name: '挑戦中',
          is_ac: false,
        },
      ],
      [
        '4',
        {
          id: '4',
          status_name: 'ns',
          image_path: 'ns.png',
          label_name: '未挑戦',
          is_ac: false,
        },
      ],
    ]),
  ),
  getSubmissionStatusMapWithName: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('$lib/services/tasks', () => {
  // Note: Mock data corresponds to MOCK_TASKS_DATA in ./fixtures/task_results.ts
  const mockTasksData = [
    {
      id: '1',
      contest_id: 'abc101',
      task_id: 'arc099_a',
      contest_type: 'ABC' as const,
      task_table_index: 'C',
      title: 'Minimization',
      grade: 'Q3' as const,
    },
    {
      id: '2',
      contest_id: 'arc099',
      task_id: 'arc099_a',
      contest_type: 'ARC' as const,
      task_table_index: 'A',
      title: 'Minimization',
      grade: 'Q3' as const,
    },
    {
      id: '3',
      contest_id: 'tessoku-book',
      task_id: 'math_and_algorithm_ai',
      contest_type: 'TESSOKU_BOOK' as const,
      task_table_index: 'A06',
      title: 'How Many Guests?',
      grade: 'Q4' as const,
    },
    {
      id: '4',
      contest_id: 'math-and-algorithm',
      task_id: 'math_and_algorithm_ai',
      contest_type: 'MATH_AND_ALGORITHM' as const,
      task_table_index: '038',
      title: 'How Many Guests?',
      grade: 'Q4' as const,
    },
    // ABC-Like Provider test data
    {
      id: '5',
      contest_id: 'tenka1-2017-beginner',
      task_id: 'tenka1_2017_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Accepted...?',
      grade: 'Q7' as const,
    },
    {
      id: '6',
      contest_id: 'tenka1-2017-beginner',
      task_id: 'tenka1_2017_c',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'C',
      title: '4/N',
      grade: 'Q5' as const,
    },
    {
      id: '7',
      contest_id: 'tenka1-2017',
      task_id: 'tenka1_2017_c',
      contest_type: 'ARC_LIKE' as const,
      task_table_index: 'C',
      title: '4/N',
      grade: 'Q5' as const,
    },
    {
      id: '8',
      contest_id: 'abl',
      task_id: 'abl_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Repeat ACL',
      grade: 'Q7' as const,
    },
    {
      id: '9',
      contest_id: 'abl',
      task_id: 'abl_f',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'F',
      title: 'Heights and Pairs',
      grade: 'D4' as const,
    },
    {
      id: '10',
      contest_id: 'caddi2018b',
      task_id: 'caddi2018b_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: '12/22',
      grade: 'Q7' as const,
    },
    {
      id: '11',
      contest_id: 'soundhound2018-summer-qual',
      task_id: 'soundhound2018_summer_qual_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'F',
      grade: 'Q7' as const,
    },
    {
      id: '12',
      contest_id: 'aising2019',
      task_id: 'aising2019_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Bulletin Board',
      grade: 'Q7' as const,
    },
    {
      id: '13',
      contest_id: 'aising2019',
      task_id: 'aising2019_e',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'E',
      title: 'Attack to a Tree',
      grade: 'D2' as const,
    },
    {
      id: '14',
      contest_id: 'sumitrust2019',
      task_id: 'sumitrust2019_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'November 30',
      grade: 'Q7' as const,
    },
    {
      id: '15',
      contest_id: 'aising2020',
      task_id: 'aising2020_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Number of Multiples',
      grade: 'Q7' as const,
    },
    {
      id: '16',
      contest_id: 'aising2020',
      task_id: 'aising2020_f',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'F',
      title: 'Two Snuke',
      grade: 'Q1' as const,
    },
    {
      id: '17',
      contest_id: 'hhkb2020',
      task_id: 'hhkb2020_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Keyboard',
      grade: 'Q7' as const,
    },
    {
      id: '18',
      contest_id: 'm-solutions2020',
      task_id: 'm_solutions2020_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Kyu in AtCoder',
      grade: 'Q7' as const,
    },
    {
      id: '19',
      contest_id: 'panasonic2020',
      task_id: 'panasonic2020_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Kth Term',
      grade: 'Q8' as const,
    },
    {
      id: '20',
      contest_id: 'jsc2021',
      task_id: 'jsc2021_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Competition',
      grade: 'Q7' as const,
    },
    {
      id: '21',
      contest_id: 'jsc2021',
      task_id: 'jsc2021_h',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'H',
      title: 'Shipping',
      grade: 'Q0' as const,
    },
    {
      id: '22',
      contest_id: 'zone2021',
      task_id: 'zone2021_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'UFO Invasion',
      grade: 'Q7' as const,
    },
    {
      id: '23',
      contest_id: 'jsc2025advance-final',
      task_id: 'abc422_a',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'A',
      title: 'Stage Clear',
      grade: 'Q7' as const,
    },
    {
      id: '24',
      contest_id: 'jsc2025advance-final',
      task_id: 'abc422_g',
      contest_type: 'ABC_LIKE' as const,
      task_table_index: 'G',
      title: 'Balls and Boxes',
      grade: 'D3' as const,
    },
  ];

  const mockTasksMap = new Map(
    mockTasksData.map((task) => [`${task.contest_id}:${task.task_id}`, task]),
  );

  return {
    getTasks: vi.fn(),
    getMergedTasksMap: vi.fn().mockResolvedValue(mockTasksMap),
    getTasksWithSelectedTaskIds: vi.fn(),
    getTask: vi.fn(),
    __mockTasksMap: mockTasksMap,
  };
});

vi.mock('$lib/services/users', () => ({
  getUser: vi.fn(),
}));

let mockAnswersForTest = new Map();

vi.mock('$lib/services/answers', () => ({
  getAnswers: vi.fn(async () => mockAnswersForTest),
  getAnswersWithSelectedTaskIds: vi.fn(),
  getAnswer: vi.fn(),
  upsertAnswer: vi.fn(),
}));

// Generate testCases from fixtures
const testCases = MOCK_TASKS_DATA.map((task) => ({
  contest_id: task.contest_id,
  task_id: task.task_id,
}));

describe('getTaskResults', () => {
  let taskResults: TaskResults;

  describe('when no answers exist', () => {
    beforeEach(async () => {
      mockAnswersForTest = new Map();
      taskResults = await getTaskResults('user_123');
    });

    test('expects to include ContestTaskPair tasks', () => {
      expect(taskResults).toBeInstanceOf(Array);
      expect(taskResults.length).toBeGreaterThan(0);
    });

    test('expects to handle multiple contestIds with same taskId', () => {
      const taskCByAbc = taskResults.find(
        (taskResult: TaskResult) =>
          taskResult.task_id === 'arc099_a' && taskResult.contest_id === 'abc101',
      );
      const taskAByArc = taskResults.find(
        (taskResult: TaskResult) =>
          taskResult.task_id === 'arc099_a' && taskResult.contest_id === 'arc099',
      );

      expect(taskCByAbc).toBeDefined();
      expect(taskAByArc).toBeDefined();

      // Different instances for different contests
      expect(taskCByAbc).not.toBe(taskAByArc);
    });

    test('expects each TaskResult to preserve contest_id and task_id', () => {
      taskResults.forEach((taskResult: TaskResult) => {
        expect(taskResult.contest_id).toBeDefined();
        expect(taskResult.task_id).toBeDefined();
        expect(typeof taskResult.contest_id).toBe('string');
        expect(typeof taskResult.task_id).toBe('string');
      });
    });

    test('expects to set default values when no answer exists', () => {
      // All taskResults are default values due to answers is empty in the mock.
      taskResults.forEach((taskResult: TaskResult) => {
        expect(taskResult.is_ac).toBe(false);
        expect(taskResult.status_name).toBe('ns');
        expect(taskResult.submission_status_label_name).toBe('未挑戦');
      });
    });
  });

  describe('when answers exist', () => {
    beforeEach(async () => {
      mockAnswersForTest = MOCK_ANSWERS_WITH_ANSWERS;
      taskResults = await getTaskResults('user_123');
    });

    test('expects to merge tasks with their answer statuses', () => {
      expect(taskResults.length).toBeGreaterThan(0);

      taskResults.forEach((taskResult: TaskResult) => {
        expect(taskResult.status_name).toBeDefined();
        expect(taskResult.is_ac).toBeDefined();
      });
    });

    test('expects all tasks to have merged status from answers', () => {
      EXPECTED_STATUSES.forEach(({ contest_id, task_id, status_name, is_ac }) => {
        const taskResult = taskResults.find(
          (taskResult: TaskResult) =>
            taskResult.task_id === task_id && taskResult.contest_id === contest_id,
        );

        expect(taskResult).toBeDefined();
        expect(taskResult?.status_name).toBe(status_name);
        expect(taskResult?.is_ac).toBe(is_ac);
      });
    });
  });
});

describe('mergeTaskAndAnswer', () => {
  createMergedTaskResults(
    'when no answers exist',
    () => {
      mockAnswersForTest = new Map();
    },
    '',
  );

  createMergedTaskResults(
    'when answers exist',
    () => {
      mockAnswersForTest = MOCK_ANSWERS_WITH_ANSWERS;
    },
    ' with answer',
  );
});

function createMergedTaskResults(
  describeName: string,
  setupAnswers: () => void,
  testNameSuffix: string,
) {
  describe(describeName, () => {
    beforeEach(() => {
      setupAnswers();
    });

    testCases.forEach(({ contest_id, task_id }: any) => {
      test(`expects to preserve contest_id and task_id${testNameSuffix} for ${contest_id}:${task_id}`, async () => {
        const taskResults = await getTaskResults('user_123');
        const taskResult = taskResults.find(
          (task) => task.task_id === task_id && task.contest_id === contest_id,
        );

        expect(taskResult).toBeDefined();
        expect(taskResult?.contest_id).toBe(contest_id);
        expect(taskResult?.task_id).toBe(task_id);
      });
    });
  });
}
