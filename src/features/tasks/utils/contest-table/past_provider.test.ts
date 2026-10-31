import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResults } from '#lib/types/task.js';

import { PastProvider } from './past_provider';

const createProvider = (round: number) => new PastProvider(ContestType.PAST, round);

// past24-open: 15 problems (A–O), the latest round
const tasksRound24: TaskResults = [
  ['A', 'Centroid'],
  ['B', 'Candy distribution'],
  ['C', 'Complete'],
  ['D', 'Scale Image'],
  ['E', 'Unique Value'],
  ['F', 'Cumulative Number'],
  ['G', 'Swap Rows and Columns'],
  ['H', 'Cluster of Squares'],
  ['I', 'Cut off'],
  ['J', 'Equilateral Triangle on Graph'],
  ['K', 'Serial Collect'],
  ['L', 'Minimum Spanning Tree'],
  ['M', 'Insertion and Deletion'],
  ['N', 'Sum of Number of Connected Component'],
  ['O', 'Longest Increasing Subsequence'],
].map(([taskTableIndex, name]) => ({
  contest_id: 'past24-open',
  task_id: `past24_${taskTableIndex.toLowerCase()}`,
  task_table_index: taskTableIndex,
  title: `${taskTableIndex}. ${name}`,
})) as TaskResults;

// past15-open: the first round named by its number; task ids still use the year-month
const tasksRound15: TaskResults = [
  {
    contest_id: 'past15-open',
    task_id: 'past202306_a',
    task_table_index: 'A',
    title: 'A. ペナルティ',
  },
  {
    contest_id: 'past15-open',
    task_id: 'past202306_b',
    task_table_index: 'B',
    title: 'B. 殿堂入り',
  },
] as TaskResults;

// past201912-open: the 1st round, named by its year-month
const tasksRound1: TaskResults = [
  {
    contest_id: 'past201912-open',
    task_id: 'past201912_a',
    task_table_index: 'A',
    title: 'A. Is It a Number?',
  },
  {
    contest_id: 'past201912-open',
    task_id: 'past201912_b',
    task_table_index: 'B',
    title: 'B. Up and Down',
  },
] as TaskResults;

// pastbook2022 is classified as PAST but is a problem book, not a round
const tasksPastBook: TaskResults = [
  {
    contest_id: 'pastbook2022',
    task_id: 'pastbook2022_g',
    task_table_index: 'G',
    title: 'G. 一点更新・区間最小値',
  },
  {
    contest_id: 'pastbook2022',
    task_id: 'pastbook2022_h',
    task_table_index: 'H',
    title: 'H. 区間加算・区間最小値',
  },
] as TaskResults;

const mixedTasks: TaskResults = [
  ...tasksRound24,
  ...tasksRound15,
  ...tasksRound1,
  ...tasksPastBook,
] as TaskResults;

describe('PastProvider', () => {
  const provider24 = createProvider(24);

  describe('filter', () => {
    describe('successful cases', () => {
      test('returns only tasks of the given round', () => {
        const filtered = provider24.filter(mixedTasks);

        expect(filtered).toHaveLength(15);
        expect(filtered.every((task) => task.contest_id === 'past24-open')).toBe(true);
      });

      test('maps round 1 to past201912-open', () => {
        expect(createProvider(1).filter(mixedTasks)).toEqual(tasksRound1);
      });

      test('maps round 15 to past15-open', () => {
        expect(createProvider(15).filter(mixedTasks)).toEqual(tasksRound15);
      });
    });

    describe('excludes', () => {
      test('excludes tasks from other rounds', () => {
        const filtered = provider24.filter(mixedTasks);

        expect(filtered.some((task) => task.contest_id === 'past15-open')).toBe(false);
        expect(filtered.some((task) => task.contest_id === 'past201912-open')).toBe(false);
      });

      test.each([1, 15, 24])('excludes pastbook2022 tasks for round %i', (round) => {
        expect(createProvider(round).filter(tasksPastBook)).toEqual([]);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider24.filter([] as TaskResults)).toEqual([]);
      });
    });
  });

  describe('getProviderKey', () => {
    test('returns PAST::{round}', () => {
      expect(provider24.getProviderKey()).toBe('PAST::24');
    });
  });

  describe('getMetadata', () => {
    test.each([
      [1, 'PAST 第 1 回'],
      [15, 'PAST 第 15 回'],
      [24, 'PAST 第 24 回'],
    ])('returns PAST 第 N 回 as the title for round %i', (round, expected) => {
      expect(createProvider(round).getMetadata().title).toBe(expected);
    });

    test('returns pastN as abbreviationName', () => {
      expect(provider24.getMetadata().abbreviationName).toBe('past24');
    });

    test('returns the per-contest title style', () => {
      expect(provider24.getMetadata().titleStyle).toEqual({
        headingTag: 'h2',
        fontSize: 'text-xl',
        fontWeight: 'font-bold',
        bottomGap: 'pb-1',
      });
    });
  });

  describe('getDisplayConfig', () => {
    test('returns the per-contest display config', () => {
      expect(provider24.getDisplayConfig()).toEqual({
        isShownHeader: false,
        isShownRoundLabel: false,
        roundLabelWidth: '',
        tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
        isShownTaskIndex: true,
        columnWrapThreshold: 6,
      });
    });
  });

  describe('getHeaderIdsForTask', () => {
    test('returns A to O in ascending order regardless of input order', () => {
      const reversedTasks = [...tasksRound24].reverse() as TaskResults;

      expect(provider24.getHeaderIdsForTask(reversedTasks)).toEqual([
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
      ]);
    });
  });

  describe('generateTable', () => {
    test('keys the table by contest_id and task_table_index', () => {
      const table = provider24.generateTable(tasksRound24);

      expect(Object.keys(table)).toEqual(['past24-open']);
      expect(table['past24-open']['O'].task_id).toBe('past24_o');
    });
  });

  describe('getContestRoundLabel', () => {
    test('returns the same label as the title', () => {
      expect(provider24.getContestRoundLabel('past24-open')).toBe('PAST 第 24 回');
    });
  });
});
