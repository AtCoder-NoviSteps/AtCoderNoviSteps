import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResults } from '#lib/types/task.js';

import { AtCoderJapanChampionshipProvider } from './atcoder_japan_championship_provider';

const tasksArc232: TaskResults = [
  {
    contest_id: 'arc232',
    task_id: 'arc232_a',
    task_table_index: 'A',
    title: 'A. Two in the Range',
  },
  { contest_id: 'arc232', task_id: 'arc232_b', task_table_index: 'B', title: 'B. Two Flips' },
  {
    contest_id: 'arc232',
    task_id: 'arc232_c',
    task_table_index: 'C',
    title: 'C. All Add or Single Negate',
  },
  {
    contest_id: 'arc232',
    task_id: 'arc232_d',
    task_table_index: 'D',
    title: 'D. Delete Different',
  },
  { contest_id: 'arc232', task_id: 'arc232_e', task_table_index: 'E', title: 'E. Doubling' },
] as TaskResults;

const tasksArc207: TaskResults = [
  {
    contest_id: 'arc207',
    task_id: 'arc207_a',
    task_table_index: 'A',
    title: 'A. Affinity for Artifacts',
  },
] as TaskResults;

const tasksNikkei2019Qual: TaskResults = [
  {
    contest_id: 'nikkei2019-qual',
    task_id: 'nikkei2019_qual_a',
    task_table_index: 'A',
    title: 'A. Subscribers',
  },
  {
    contest_id: 'nikkei2019-qual',
    task_id: 'nikkei2019_qual_b',
    task_table_index: 'B',
    title: 'B. Touitsu',
  },
] as TaskResults;

// On AtCoder, nikkei2019ex_e is problem F and nikkei2019ex_f is problem E.
const tasksNikkei2019Ex: TaskResults = [
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_a',
    task_table_index: 'A',
    title: 'A. Prefix Array',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_b',
    task_table_index: 'B',
    title: 'B. 二乗',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_c',
    task_table_index: 'C',
    title: 'C. 11で割った余りの計算方法',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_d',
    task_table_index: 'D',
    title: 'D. 辞書順最小の数',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_f',
    task_table_index: 'E',
    title: 'E. スーパーFizzBuzz',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_e',
    task_table_index: 'F',
    title: 'F. コラッツ問題',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_g',
    task_table_index: 'G',
    title: 'G. 回文スコア',
  },
  {
    contest_id: 'nikkei2019-ex',
    task_id: 'nikkei2019ex_h',
    task_table_index: 'H',
    title: 'H. 8^kゲーム',
  },
] as TaskResults;

describe('AtCoderJapanChampionshipProvider', () => {
  const providerArc232 = new AtCoderJapanChampionshipProvider({
    contestId: 'arc232',
    contestType: ContestType.ARC,
    title: '第三回 AtCoder Japan Open -予選-（ARC 232）',
  });
  const providerNikkei2019Ex = new AtCoderJapanChampionshipProvider({
    contestId: 'nikkei2019-ex',
    contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
    title: '全国統一プログラミング王決定戦 エキシビジョン',
  });

  describe('filter', () => {
    describe('successful cases', () => {
      test('returns only tasks belonging to the given contest', () => {
        const mixedTasks = [
          ...tasksArc207,
          ...tasksArc232,
          ...tasksNikkei2019Qual,
          ...tasksNikkei2019Ex,
        ] as TaskResults;

        expect(providerArc232.filter(mixedTasks)).toEqual(tasksArc232);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(providerArc232.filter([] as TaskResults)).toEqual([]);
      });
    });
  });

  describe('getProviderKey', () => {
    test('builds the key from the entry contest type and contest id', () => {
      expect(providerArc232.getProviderKey()).toBe('ARC::arc232');
      expect(providerNikkei2019Ex.getProviderKey()).toBe(
        'ATCODER_MAIN_OFFICIAL_ONSITE::nikkei2019-ex',
      );
    });
  });

  describe('getMetadata', () => {
    test('returns the entry title as the table title and round label', () => {
      expect(providerArc232.getMetadata().title).toBe(
        '第三回 AtCoder Japan Open -予選-（ARC 232）',
      );
      expect(providerArc232.getContestRoundLabel('arc232')).toBe(
        '第三回 AtCoder Japan Open -予選-（ARC 232）',
      );
    });

    test('returns the contest id as abbreviationName', () => {
      expect(providerArc232.getMetadata().abbreviationName).toBe('arc232');
    });

    test('returns titleStyle with text-xl font size, font-bold weight, pb-1 gap, h2 heading tag', () => {
      expect(providerArc232.getMetadata().titleStyle).toEqual({
        headingTag: 'h2',
        fontSize: 'text-xl',
        fontWeight: 'font-bold',
        bottomGap: 'pb-1',
      });
    });
  });

  describe('getDisplayConfig', () => {
    test('hides the header and shows the letter before each title', () => {
      expect(providerArc232.getDisplayConfig()).toMatchObject({
        isShownHeader: false,
        isShownRoundLabel: false,
        isShownTaskIndex: true,
        columnWrapThreshold: 6,
      });
    });
  });

  describe('getHeaderIdsForTask', () => {
    test('returns letters in ascending order regardless of input order', () => {
      const reversedTasks = [...tasksNikkei2019Ex].reverse() as TaskResults;

      expect(providerNikkei2019Ex.getHeaderIdsForTask(reversedTasks)).toEqual([
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
      ]);
    });
  });

  describe('generateTable', () => {
    test('places tasks by letter even when the task id suffix differs from it', () => {
      const table = providerNikkei2019Ex.generateTable(tasksNikkei2019Ex);

      expect(table['nikkei2019-ex']['E'].task_id).toBe('nikkei2019ex_f');
      expect(table['nikkei2019-ex']['F'].task_id).toBe('nikkei2019ex_e');
    });

    // generateTable passes contestType to getTaskTableHeaderName, which renames H only for ABC.
    test.each([
      {
        name: 'an ARC qualifier',
        entry: { contestId: 'arc232', contestType: ContestType.ARC, title: 'ARC qualifier' },
        tasks: tasksArc232,
        expected: ['A', 'B', 'C', 'D', 'E'],
      },
      {
        name: 'an ARC-like qualifier',
        entry: {
          contestId: 'nikkei2019-qual',
          contestType: ContestType.ARC_LIKE,
          title: 'ARC-like qualifier',
        },
        tasks: tasksNikkei2019Qual,
        expected: ['A', 'B'],
      },
      {
        name: 'an onsite contest with problem H',
        entry: {
          contestId: 'nikkei2019-ex',
          contestType: ContestType.ATCODER_MAIN_OFFICIAL_ONSITE,
          title: 'onsite contest',
        },
        tasks: tasksNikkei2019Ex,
        expected: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      },
    ])(
      'keys the cells of $name by the same letters as the header',
      ({ entry, tasks, expected }) => {
        const provider = new AtCoderJapanChampionshipProvider(entry);
        const table = provider.generateTable(tasks);

        expect(provider.getHeaderIdsForTask(tasks)).toEqual(expected);
        expect(Object.keys(table[entry.contestId]).toSorted()).toEqual(expected);
      },
    );
  });
});
