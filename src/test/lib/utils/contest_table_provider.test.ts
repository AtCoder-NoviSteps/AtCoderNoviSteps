import { describe, test, expect, vi } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ABSProvider,
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  ABC126ToABC211Provider,
  ABC042ToABC125Provider,
  ABC001ToABC041Provider,
  ARC104OnwardsProvider,
  ARC058ToARC103Provider,
  ARC001ToARC057Provider,
  AGC001OnwardsProvider,
  ACLPracticeProvider,
  EDPCProvider,
  TDPCProvider,
  FPS24Provider,
  JOIFirstQualRoundProvider,
  JOISecondQualRound2020OnwardsProvider,
  JOIQualRoundFrom2006To2019Provider,
  JOISemiFinalRoundProvider,
  Typical90Provider,
  TessokuBookProvider,
  TessokuBookForExamplesProvider,
  TessokuBookForPracticalsProvider,
  TessokuBookForChallengesProvider,
  MathAndAlgorithmProvider,
  ContestTableProviderBase,
  ContestTableProviderGroup,
  prepareContestProviderPresets,
} from '$lib/utils/contest_table_provider';
import { TESSOKU_SECTIONS } from '$lib/types/contest_table_provider';
import {
  taskResultsForContestTableProvider,
  taskResultsForABS,
  taskResultsForARC104OnwardsProvider,
  taskResultsForAGC001OnwardsProvider,
  taskResultsForACLPracticeProvider,
} from './test_cases/contest_table_provider';

// Mock the imported functions
vi.mock('$lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId: string) => {
    if (contestId === 'abs') {
      return ContestType.ABS;
    } else if (contestId.startsWith('abc')) {
      return ContestType.ABC;
    } else if (contestId.startsWith('arc')) {
      return ContestType.ARC;
    } else if (contestId.startsWith('agc')) {
      return ContestType.AGC;
    } else if (contestId === 'dp') {
      return ContestType.EDPC;
    } else if (contestId === 'tdpc') {
      return ContestType.TDPC;
    } else if (contestId === 'fps-24') {
      return ContestType.FPS_24;
    } else if (contestId.startsWith('joi')) {
      return ContestType.JOI;
    } else if (contestId === 'typical90') {
      return ContestType.TYPICAL90;
    } else if (contestId === 'tessoku-book') {
      return ContestType.TESSOKU_BOOK;
    } else if (contestId === 'math-and-algorithm') {
      return ContestType.MATH_AND_ALGORITHM;
    } else if (contestId === 'practice2') {
      return ContestType.ACL_PRACTICE;
    }

    return ContestType.OTHERS;
  }),

  getContestNameLabel: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return `ABC ${contestId.replace('abc', '')}`;
    } else if (contestId.startsWith('arc')) {
      return `ARC ${contestId.replace('arc', '')}`;
    } else if (contestId.startsWith('agc')) {
      return `AGC ${contestId.replace('agc', '')}`;
    } else if (contestId === 'dp' || contestId === 'tdpc' || contestId === 'typical90') {
      return '';
    } else if (contestId.startsWith('joi')) {
      // JOI contest name formatting
      // Handle: joiYYYYyo1[a-c] => JOI 一次予選 YYYY 第 N 回
      const firstQual = contestId.match(/joi(\d{4})yo1([abc])/);
      if (firstQual) {
        const [, year, round] = firstQual;
        const roundMap: Record<string, string> = { a: '1', b: '2', c: '3' };

        return `JOI 一次予選 ${year} 第 ${roundMap[round]} 回`;
      }

      // Handle: joiYYYYyo2 => JOI 二次予選 YYYY
      const secondQual = contestId.match(/joi(\d{4})yo2$/);
      if (secondQual) {
        const [, year] = secondQual;
        return `JOI 二次予選 ${year}`;
      }

      // Handle: joiYYYYyo (older format) => JOI 予選 YYYY
      const qual = contestId.match(/joi(\d{4})yo$/);
      if (qual) {
        const [, year] = qual;
        return `JOI 予選 ${year}`;
      }

      // Handle: joiYYYYho => JOI 本選 YYYY
      const finalMatch = contestId.match(/joi(\d{4})ho$/);
      if (finalMatch) {
        const [, year] = finalMatch;
        return `JOI 本選 ${year}`;
      }
    }

    return contestId;
  }),
}));

vi.mock('$lib/utils/task', () => ({
  getTaskTableHeaderName: vi.fn((_: ContestType, task: TaskResult) => {
    return `${task.task_table_index}`;
  }),
}));

describe('ContestTableProviderBase and implementations', () => {
  const mockTaskResults: TaskResults = taskResultsForContestTableProvider;

  const getContestRound = (contestId: string): number => {
    const roundString = contestId.replace(/^\D+/, '');
    const round = parseInt(roundString, 10);

    if (isNaN(round)) {
      throw new Error(`Invalid contest ID format: ${contestId}`);
    }

    return round;
  };

  describe('ABC providers', () => {
    describe.each([
      {
        providerClass: ABC319OnwardsProvider,
        label: '319 onwards',
        displayConfig: {
          roundLabelWidth: 'xl:w-16',
          tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
        },
      },
      {
        providerClass: ABC212ToABC318Provider,
        label: '212 to 318',
        displayConfig: {
          roundLabelWidth: 'xl:w-16',
          tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
        },
      },
      {
        providerClass: ABC126ToABC211Provider,
        label: '126 to 211',
        displayConfig: {
          roundLabelWidth: 'xl:w-16',
          tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
        },
      },
    ])('$label', ({ providerClass, displayConfig }) => {
      test('expects to get correct display configuration', () => {
        const provider = new providerClass(ContestType.ABC);
        const config = provider.getDisplayConfig();

        expect(config.isShownHeader).toBe(true);
        expect(config.isShownRoundLabel).toBe(true);
        expect(config.roundLabelWidth).toBe(displayConfig.roundLabelWidth);
        expect(config.tableBodyCellsWidth).toBe(displayConfig.tableBodyCellsWidth);
        expect(config.isShownTaskIndex).toBe(false);
      });

      test('expects to format contest round label correctly', () => {
        const provider = new providerClass(ContestType.ABC);
        const label = provider.getContestRoundLabel('abc378');

        expect(label).toBe('378');
      });

      test('expects to handle empty task results', () => {
        const provider = new providerClass(ContestType.ABC);
        const filtered = provider.filter([] as TaskResults);

        expect(filtered).toEqual([] as TaskResults);
      });

      test('expects to get header IDs for tasks correctly', () => {
        const provider = new providerClass(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);
        const headerIds = provider.getHeaderIdsForTask(filtered as TaskResults);

        expect(headerIds.length).toBeGreaterThan(0);
        expect(headerIds.every((id) => id.length > 0)).toBe(true);
      });

      test('expects to get contest round IDs correctly', () => {
        const provider = new providerClass(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);
        const roundIds = provider.getContestRoundIds(filtered as TaskResults);

        expect(roundIds.length).toBeGreaterThan(0);
        expect(roundIds.every((id) => id.startsWith('abc'))).toBe(true);
      });

      test('expects to generate correct table structure', () => {
        const provider = new providerClass(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);
        const table = provider.generateTable(filtered);

        expect(Object.keys(table).length).toBeGreaterThan(0);

        const firstContest = Object.keys(table)[0];
        expect(table[firstContest]).toHaveProperty(Object.keys(table[firstContest])[0]);
      });
    });

    describe('ABS', () => {
      test('expects to filter tasks with contest_id "abs"', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const filtered = provider.filter(taskResultsForABS);

        expect(filtered).toHaveLength(11);
        expect(filtered.every((task) => task.contest_id === 'abs')).toBe(true);
      });

      test('expects to filter only ABS-type contests', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const mixed = [
          { ...taskResultsForABS[0], contest_id: 'abs' },
          { ...taskResultsForABS[0], contest_id: 'abc378' },
          { ...taskResultsForABS[0], contest_id: 'arc100' },
        ] as TaskResults;

        const filtered = provider.filter(mixed);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].contest_id).toBe('abs');
      });

      test('expects to return correct metadata', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const metadata = provider.getMetadata();

        expect(metadata.title).toBe('AtCoder Beginners Selection');
        expect(metadata.abbreviationName).toBe('abs');
      });

      test('expects to return correct display config with ABS-specific settings', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const config = provider.getDisplayConfig();

        expect(config.isShownHeader).toBe(false);
        expect(config.isShownRoundLabel).toBe(false);
        expect(config.isShownTaskIndex).toBe(false);
        expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2');
        expect(config.roundLabelWidth).toBe('');
      });

      test('expects to return empty string for contest round label', () => {
        const provider = new ABSProvider(ContestType.ABS);

        expect(provider.getContestRoundLabel('abs')).toBe('');
        expect(provider.getContestRoundLabel('abc086')).toBe('');
      });

      test('expects to generate correct table structure with all 11 problems', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const table = provider.generateTable(taskResultsForABS);

        expect(table).toHaveProperty('abs');
        expect(Object.keys(table.abs)).toHaveLength(11);
        expect(Object.keys(table.abs)).toEqual([
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
        ]);
      });

      test('expects to return correct contest round ids', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const roundIds = provider.getContestRoundIds(taskResultsForABS);

        expect(roundIds).toEqual(['abs']);
      });

      test('expects to return correct header ids for all problems', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const headerIds = provider.getHeaderIdsForTask(taskResultsForABS);

        expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
      });

      test('expects to verify that ABS problems come from multiple different contests', () => {
        const provider = new ABSProvider(ContestType.ABS);
        const filtered = provider.filter(taskResultsForABS);

        // Extract the original contest_id from task_id
        const sourceContests = new Set(
          filtered.map((task) => {
            if (task.task_id === 'practice_1') {
              return 'practice';
            }

            const match = task.task_id.match(/^(arc|abc)\d+/);
            return match ? match[0] : null;
          }),
        );

        // Derived from 8 different contests from the 10 problems excluding practice_1
        expect(Array.from(sourceContests)).toContain('abc086');
        expect(Array.from(sourceContests)).toContain('abc081');
        expect(Array.from(sourceContests)).toContain('arc089');
        expect(Array.from(sourceContests)).toContain('arc065');
      });

      test('expects to handle empty input gracefully', () => {
        const provider = new ABSProvider(ContestType.ABS);

        const filteredEmpty = provider.filter([] as TaskResults);
        const tableEmpty = provider.generateTable([] as TaskResults);
        const idsEmpty = provider.getContestRoundIds([] as TaskResults);
        const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResults);

        expect(filteredEmpty).toEqual([]);
        expect(tableEmpty).toEqual({});
        expect(idsEmpty).toEqual([]);
        expect(headerIdsEmpty).toEqual([]);
      });
    });

    // ABC 319 Onwards only
    describe('ABC 319 Onwards', () => {
      test('expects to filter tasks to include only ABC319 and later', () => {
        const provider = new ABC319OnwardsProvider(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 319 && round <= 999;
          }),
        ).toBe(true);
      });

      test('expects to get correct metadata', () => {
        const provider = new ABC319OnwardsProvider(ContestType.ABC);
        const metadata = provider.getMetadata();

        expect(metadata.title).toBe('AtCoder Beginner Contest 319 〜（7 問制）');
        expect(metadata.abbreviationName).toBe('abc319Onwards');
      });

      test('expects to handle task results with different contest types', () => {
        const provider = new ABC319OnwardsProvider(ContestType.ABC);
        const mockMixedTasks = [
          { contest_id: 'abc200', task_id: 'abc200_a', task_table_index: 'A' },
          { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
          { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
          { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
        ];
        const filtered = provider.filter(mockMixedTasks as TaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 319;
          }),
        ).toBe(true);
      });
    });

    // ABC 212-318 only
    describe('ABC 212 to ABC 318', () => {
      test('expects to filter tasks to include only ABC between 212 and 318', () => {
        const provider = new ABC212ToABC318Provider(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 212 && round <= 318;
          }),
        ).toBe(true);
      });

      test('expects to get correct metadata', () => {
        const provider = new ABC212ToABC318Provider(ContestType.ABC);
        const metadata = provider.getMetadata();

        expect(metadata.title).toBe('AtCoder Beginner Contest 212 〜 318（8 問制）');
        expect(metadata.abbreviationName).toBe('fromAbc212ToAbc318');
      });

      test('expects to handle task results with different contest types and out-of-range ABC', () => {
        const provider = new ABC212ToABC318Provider(ContestType.ABC);
        const mockMixedTasks = [
          { contest_id: 'abc100', task_id: 'abc100_a', task_table_index: 'A' },
          { contest_id: 'abc250', task_id: 'abc250_a', task_table_index: 'A' },
          { contest_id: 'abc398', task_id: 'abc398_a', task_table_index: 'A' },
          { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
          { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
        ];
        const filtered = provider.filter(mockMixedTasks as TaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 212 && round <= 318;
          }),
        ).toBe(true);
      });
    });

    // ABC 126-211 only
    describe('ABC 126 to ABC 211', () => {
      test('expects to filter tasks to include only ABC between 126 and 211', () => {
        const provider = new ABC126ToABC211Provider(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 126 && round <= 211;
          }),
        ).toBe(true);
      });

      test('expects to get correct metadata', () => {
        const provider = new ABC126ToABC211Provider(ContestType.ABC);
        const metadata = provider.getMetadata();

        expect(metadata.title).toBe('AtCoder Beginner Contest 126 〜 211（6 問制）');
        expect(metadata.abbreviationName).toBe('fromAbc126ToAbc211');
      });

      test('expects to get header IDs for tasks correctly', () => {
        const provider = new ABC126ToABC211Provider(ContestType.ABC);
        const filtered = provider.filter(mockTaskResults);
        const headerIds = provider.getHeaderIdsForTask(filtered);

        expect(headerIds.length).toBeGreaterThan(0);
        expect(headerIds.every((id) => ['A', 'B', 'C', 'D', 'E', 'F'].includes(id))).toBe(true);
      });

      test('expects to handle task results with different contest types and out-of-range ABC', () => {
        const provider = new ABC126ToABC211Provider(ContestType.ABC);
        const mockMixedTasks = [
          { contest_id: 'abc100', task_id: 'abc100_a', task_table_index: 'A' },
          { contest_id: 'abc150', task_id: 'abc150_a', task_table_index: 'A' },
          { contest_id: 'abc211', task_id: 'abc211_f', task_table_index: 'F' },
          { contest_id: 'abc398', task_id: 'abc398_a', task_table_index: 'A' },
          { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
          { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
        ];
        const filtered = provider.filter(mockMixedTasks as TaskResults);

        expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
        expect(
          filtered.every((task) => {
            const round = getContestRound(task.contest_id);
            return round >= 126 && round <= 211;
          }),
        ).toBe(true);
      });
    });
  });

  // ABC042 to ABC125 only
  describe('ABC 042 to ABC 125', () => {
    test('expects to filter tasks within ABC042-125 range', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mixed = [
        { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc125', task_id: 'abc125_a', task_table_index: 'A' },
        { contest_id: 'abc126', task_id: 'abc126_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((task) => task.contest_id)).toEqual(['abc042', 'abc125']);
    });

    test('expects to filter only ABC-type contests', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mixed = [
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].contest_id).toBe('abc042');
      expect(filtered[1].contest_id).toBe('abc042');
    });

    test('expects to return correct metadata', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 042 〜 125（ARC 同時開催が大半）');
      expect(metadata.abbreviationName).toBe('fromAbc042ToAbc125');
    });

    test('expects to return correct display config', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(true);
      expect(config.isShownRoundLabel).toBe(true);
      expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
      expect(config.roundLabelWidth).toBe('xl:w-16');
      expect(config.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);

      expect(provider.getContestRoundLabel('abc042')).toBe('042');
      expect(provider.getContestRoundLabel('abc125')).toBe('125');
    });

    test('expects to generate correct table structure', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'abc042_b', task_table_index: 'B' },
        { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'abc042', task_id: 'arc058_b', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockTasks as TaskResults);

      expect(table).toHaveProperty('abc042');
      expect(table.abc042).toHaveProperty('A');
      expect(table.abc042).toHaveProperty('B');
      expect(table.abc042).toHaveProperty('C');
      expect(table.abc042).toHaveProperty('D');
    });

    test('expects to return correct round id', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc125', task_id: 'abc125_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mockTasks as TaskResults);
      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toContain('abc042');
      expect(roundIds).toContain('abc125');
    });

    test('expects to return correct header id metadata', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const metadata = provider.getMetadata();

      expect(metadata.abbreviationName).toBe('fromAbc042ToAbc125');
    });

    test('expects to handle empty input', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const table = provider.generateTable([] as TaskResults);

      expect(table).toEqual({});
    });

    test('expects to exclude non-ABC contests even if in range', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mixed = [
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc043', task_id: 'abc043_a', task_table_index: 'A' },
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc059', task_id: 'arc059_a', task_table_index: 'C' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.contest_id.startsWith('abc'))).toBe(true);
    });

    test('expects to generate correct table structure with shared problems (ABC042 with ARC058)', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mockAbc042Tasks = [
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'abc042_b', task_table_index: 'B' },
        { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'abc042', task_id: 'arc058_b', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockAbc042Tasks as TaskResults);

      expect(table).toHaveProperty('abc042');
      expect(table.abc042).toHaveProperty('A'); // only ABC
      expect(table.abc042).toHaveProperty('B'); // only ABC
      expect(table.abc042).toHaveProperty('C'); // shared problem (ARC side task_id)
      expect(table.abc042).toHaveProperty('D'); // shared problem (ARC side task_id)
    });

    test('expects to handle both solo and concurrent contests correctly', () => {
      const provider = new ABC042ToABC125Provider(ContestType.ABC);
      const mixed = [
        // ABC042: Concurrent with ARC058
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
        // ABC051: Single round without ARC
        { contest_id: 'abc051', task_id: 'abc051_c', task_table_index: 'C' },
        { contest_id: 'abc051', task_id: 'abc051_d', task_table_index: 'D' },
      ];

      const filtered = provider.filter(mixed as TaskResults);
      const table = provider.generateTable(filtered);

      expect(table).toHaveProperty('abc042');
      expect(table).toHaveProperty('abc051');
      expect(table.abc042).toHaveProperty('C'); // shared problem
      expect(table.abc051).toHaveProperty('C');
      expect(table.abc051).toHaveProperty('D');
    });
  });

  // ABC001 to ABC 041
  describe('ABC 001 to ABC 041', () => {
    test('expects to filter tasks within ABC001-41 range', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mixed = [
        { contest_id: 'abc000', task_id: 'abc000_1', task_table_index: 'A' },
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' },
        { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResult[]);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((task) => task.contest_id)).toEqual(['abc001', 'abc020', 'abc041']);
    });

    test('expects to filter only ABC-type contests and exclude ARC', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mixed = [
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
        { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResult[]);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
    });

    test('expects to return correct metadata', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 001 〜 041（レーティング導入前）');
      expect(metadata.abbreviationName).toBe('fromAbc001ToAbc041');
    });

    test('expects to return correct display config', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(true);
      expect(config.isShownRoundLabel).toBe(true);
      expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
      expect(config.roundLabelWidth).toBe('xl:w-16');
      expect(config.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);

      expect(provider.getContestRoundLabel('abc001')).toBe('001');
      expect(provider.getContestRoundLabel('abc041')).toBe('041');
    });

    test('expects to generate correct table structure with old ID format (numeric suffix)', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'abc001', task_id: 'abc001_2', task_table_index: 'B' },
        { contest_id: 'abc001', task_id: 'abc001_3', task_table_index: 'C' },
        { contest_id: 'abc001', task_id: 'abc001_4', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockTasks as TaskResult[]);

      expect(table).toHaveProperty('abc001');
      expect(table.abc001).toHaveProperty('A');
      expect(table.abc001).toHaveProperty('B');
      expect(table.abc001).toHaveProperty('C');
      expect(table.abc001).toHaveProperty('D');
    });

    test('expects to generate correct table structure with new ID format (alphabet suffix)', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' },
        { contest_id: 'abc020', task_id: 'abc020_b', task_table_index: 'B' },
        { contest_id: 'abc020', task_id: 'abc020_c', task_table_index: 'C' },
        { contest_id: 'abc020', task_id: 'abc020_d', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockTasks as TaskResult[]);

      expect(table).toHaveProperty('abc020');
      expect(table.abc020).toHaveProperty('A');
      expect(table.abc020).toHaveProperty('B');
      expect(table.abc020).toHaveProperty('C');
      expect(table.abc020).toHaveProperty('D');
    });

    test('expects to return correct contest round ids', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' },
        { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
      ];

      const ids = provider.getContestRoundIds(mockTasks as TaskResult[]);

      expect(ids).toContain('abc001');
      expect(ids).toContain('abc020');
      expect(ids).toContain('abc041');
    });

    test('expects to return correct header ids', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);
      const mockTasks = [
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'abc001', task_id: 'abc001_2', task_table_index: 'B' },
        { contest_id: 'abc001', task_id: 'abc001_3', task_table_index: 'C' },
        { contest_id: 'abc001', task_id: 'abc001_4', task_table_index: 'D' },
      ];

      const ids = provider.getHeaderIdsForTask(mockTasks as TaskResult[]);

      expect(ids).toEqual(['A', 'B', 'C', 'D']);
    });

    test('expects to handle empty input gracefully', () => {
      const provider = new ABC001ToABC041Provider(ContestType.ABC);

      const filteredEmpty = provider.filter([] as TaskResult[]);
      const tableEmpty = provider.generateTable([] as TaskResult[]);
      const idsEmpty = provider.getContestRoundIds([] as TaskResult[]);
      const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResult[]);

      expect(filteredEmpty).toEqual([]);
      expect(tableEmpty).toEqual({});
      expect(idsEmpty).toEqual([]);
      expect(headerIdsEmpty).toEqual([]);
    });
  });

  // ARC 104 Onwards only
  describe('ARC 104 Onwards', () => {
    test('expects to filter tasks to include only ARC104 and later', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const filtered = provider.filter(taskResultsForARC104OnwardsProvider);

      expect(filtered.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 104 && round <= 999;
        }),
      ).toBe(true);
    });

    test('expects to get correct metadata', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Regular Contest 104 〜 ');
      expect(metadata.abbreviationName).toBe('arc104Onwards');
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const filtered = provider.filter(taskResultsForARC104OnwardsProvider);
      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds.length).toBeGreaterThan(0);
      expect(headerIds.every((id) => id.length > 0)).toBe(true);
    });

    test('expects to generate correct table structure', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const filtered = provider.filter(taskResultsForARC104OnwardsProvider);
      const table = provider.generateTable(filtered);

      expect(Object.keys(table).length).toBeGreaterThan(0);
      expect(table).toHaveProperty('arc104');
      expect(table).toHaveProperty('arc120');
      expect(table).toHaveProperty('arc204');
      expect(table).toHaveProperty('arc208');
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const filtered = provider.filter(taskResultsForARC104OnwardsProvider);
      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toContain('arc104');
      expect(roundIds).toContain('arc120');
      expect(roundIds).toContain('arc204');
      expect(roundIds).toContain('arc208');
      expect(roundIds.every((id) => id.startsWith('arc'))).toBe(true);
    });

    test('expects to handle 4-problem contest pattern (ARC204)', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const arc204Tasks = taskResultsForARC104OnwardsProvider.filter(
        (task) => task.contest_id === 'arc204',
      );
      const headerIds = provider.getHeaderIdsForTask(arc204Tasks as TaskResults);

      expect(arc204Tasks).toHaveLength(4);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D']);
    });

    test('expects to handle 5-problem contest pattern (ARC208)', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const arc208Tasks = taskResultsForARC104OnwardsProvider.filter(
        (task) => task.contest_id === 'arc208',
      );
      const headerIds = provider.getHeaderIdsForTask(arc208Tasks as TaskResults);

      expect(arc208Tasks).toHaveLength(5);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    test('expects to handle 6-problem contest pattern (ARC104)', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const arc104Tasks = taskResultsForARC104OnwardsProvider.filter(
        (task) => task.contest_id === 'arc104',
      );
      const headerIds = provider.getHeaderIdsForTask(arc104Tasks as TaskResults);

      expect(arc104Tasks).toHaveLength(6);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });

    test('expects to handle 7-problem contest pattern with F2 (ARC120)', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const arc120Tasks = taskResultsForARC104OnwardsProvider.filter(
        (task) => task.contest_id === 'arc120',
      );
      const headerIds = provider.getHeaderIdsForTask(arc120Tasks as TaskResults);

      expect(arc120Tasks).toHaveLength(7);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'F2']);
    });

    test('expects to maintain proper alphabetical/numeric sort order', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const unsortedTasks = [
        { contest_id: 'arc104', task_id: 'arc104_f', task_table_index: 'F' },
        { contest_id: 'arc104', task_id: 'arc104_c', task_table_index: 'C' },
        { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
        { contest_id: 'arc104', task_id: 'arc104_f2', task_table_index: 'F2' },
      ];
      const headerIds = provider.getHeaderIdsForTask(unsortedTasks as TaskResults);

      expect(headerIds).toEqual(['A', 'C', 'F', 'F2']);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const mixedTasks = [
        { contest_id: 'arc200', task_id: 'arc200_a', task_table_index: 'A' },
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
    });

    test('expects to exclude contests below ARC104', () => {
      const provider = new ARC104OnwardsProvider(ContestType.ARC);
      const mixedTasks = [
        { contest_id: 'arc100', task_id: 'arc100_a', task_table_index: 'A' },
        { contest_id: 'arc103', task_id: 'arc103_a', task_table_index: 'A' },
        { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
        { contest_id: 'arc105', task_id: 'arc105_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 104;
        }),
      ).toBe(true);
    });
  });

  // ARC058 to ARC103 only
  describe('ARC 058 to ARC 103', () => {
    test('expects to filter tasks within ARC058-103 range', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mixed = [
        { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc103', task_id: 'arc103_a', task_table_index: 'C' },
        { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((task) => task.contest_id)).toEqual(['arc058', 'arc103']);
    });

    test('expects to filter only ARC-type contests', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mixed = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc058', task_id: 'arc058_f', task_table_index: 'F' },
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].contest_id).toBe('arc058');
      expect(filtered[1].contest_id).toBe('arc058');
    });

    test('expects to return correct metadata', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Regular Contest 058 〜 103（ABC 同時開催）');
      expect(metadata.abbreviationName).toBe('fromArc058ToArc103');
    });

    test('expects to return correct display config', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(true);
      expect(config.isShownRoundLabel).toBe(true);
      expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
      expect(config.roundLabelWidth).toBe('xl:w-16');
      expect(config.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);

      expect(provider.getContestRoundLabel('arc058')).toBe('058');
      expect(provider.getContestRoundLabel('arc103')).toBe('103');
    });

    test('expects to generate correct table structure', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
        { contest_id: 'arc058', task_id: 'arc058_c', task_table_index: 'E' },
        { contest_id: 'arc058', task_id: 'arc058_d', task_table_index: 'F' },
      ];

      const table = provider.generateTable(mockTasks as TaskResults);

      expect(table).toHaveProperty('arc058');
      expect(table.arc058).toHaveProperty('C');
      expect(table.arc058).toHaveProperty('D');
      expect(table.arc058).toHaveProperty('E');
      expect(table.arc058).toHaveProperty('F');
    });

    test('expects to return correct round ids', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc103', task_id: 'arc103_a', task_table_index: 'C' },
      ];
      const filtered = provider.filter(mockTasks as TaskResults);
      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toContain('arc058');
      expect(roundIds).toContain('arc103');
    });

    test('expects to return correct header id metadata', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const metadata = provider.getMetadata();

      expect(metadata.abbreviationName).toBe('fromArc058ToArc103');
    });

    test('expects to handle empty input', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const table = provider.generateTable([] as TaskResults);

      expect(table).toEqual({});
    });

    test('expects to exclude non-ARC contests even if in range', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mixed = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc059', task_id: 'arc059_a', task_table_index: 'C' },
        { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
        { contest_id: 'abc043', task_id: 'abc043_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
    });

    test('expects to generate correct table structure with shared and exclusive problems (ARC058)', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);
      const mockArc058Tasks = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
        { contest_id: 'arc058', task_id: 'arc058_c', task_table_index: 'E' },
        { contest_id: 'arc058', task_id: 'arc058_d', task_table_index: 'F' },
      ];

      const table = provider.generateTable(mockArc058Tasks as TaskResults);

      expect(table).toHaveProperty('arc058');
      expect(table.arc058).toHaveProperty('C'); // shared problem (ABC side task_id)
      expect(table.arc058).toHaveProperty('D'); // shared problem (ABC side task_id)
      expect(table.arc058).toHaveProperty('E'); // only ARC
      expect(table.arc058).toHaveProperty('F'); // only ARC
    });

    test('expects to correctly handle ARC58-103 where all rounds are concurrent with ABC', () => {
      const provider = new ARC058ToARC103Provider(ContestType.ARC);

      // ARC058 (Concurrent with ABC042)
      const arc058Tasks = [
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
        { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
      ];

      // ARC060 (Concurrent with ABC044)
      const arc060Tasks = [
        { contest_id: 'arc060', task_id: 'arc060_a', task_table_index: 'C' },
        { contest_id: 'arc060', task_id: 'arc060_b', task_table_index: 'D' },
      ];

      const mixed = [...arc058Tasks, ...arc060Tasks];
      const filtered = provider.filter(mixed as TaskResults);
      const table = provider.generateTable(filtered);

      expect(filtered).toHaveLength(4);
      expect(table).toHaveProperty('arc058');
      expect(table).toHaveProperty('arc060');
    });
  });

  describe('ARC 001 to ARC 057', () => {
    test('expects to filter tasks within ARC001-57 range', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mixed = [
        { contest_id: 'arc000', task_id: 'arc000_1', task_table_index: 'A' },
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'arc035', task_id: 'arc035_a', task_table_index: 'A' },
        { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
        { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResult[]);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((task) => task.contest_id)).toEqual(['arc001', 'arc035', 'arc057']);
    });

    test('expects to filter only ARC-type contests and exclude ABC', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mixed = [
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
        { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
        { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
      ];

      const filtered = provider.filter(mixed as TaskResult[]);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
    });

    test('expects to return correct metadata', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Regular Contest 001 〜 057（レーティング導入前）');
      expect(metadata.abbreviationName).toBe('fromArc001ToArc057');
    });

    test('expects to return correct display config', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(true);
      expect(config.isShownRoundLabel).toBe(true);
      expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
      expect(config.roundLabelWidth).toBe('xl:w-16');
      expect(config.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);

      expect(provider.getContestRoundLabel('arc001')).toBe('001');
      expect(provider.getContestRoundLabel('arc057')).toBe('057');
    });

    test('expects to generate correct table structure with old ID format (numeric suffix)', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'arc001', task_id: 'arc001_2', task_table_index: 'B' },
        { contest_id: 'arc001', task_id: 'arc001_3', task_table_index: 'C' },
        { contest_id: 'arc001', task_id: 'arc001_4', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockTasks as TaskResult[]);

      expect(table).toHaveProperty('arc001');
      expect(table.arc001).toHaveProperty('A');
      expect(table.arc001).toHaveProperty('B');
      expect(table.arc001).toHaveProperty('C');
      expect(table.arc001).toHaveProperty('D');
    });

    test('expects to generate correct table structure with new ID format (alphabet suffix)', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc035', task_id: 'arc035_a', task_table_index: 'A' },
        { contest_id: 'arc035', task_id: 'arc035_b', task_table_index: 'B' },
        { contest_id: 'arc035', task_id: 'arc035_c', task_table_index: 'C' },
        { contest_id: 'arc035', task_id: 'arc035_d', task_table_index: 'D' },
      ];

      const table = provider.generateTable(mockTasks as TaskResult[]);

      expect(table).toHaveProperty('arc035');
      expect(table.arc035).toHaveProperty('A');
      expect(table.arc035).toHaveProperty('B');
      expect(table.arc035).toHaveProperty('C');
      expect(table.arc035).toHaveProperty('D');
    });

    test('expects to return correct contest round ids', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'arc035', task_id: 'arc035_a', task_table_index: 'A' },
        { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
      ];

      const ids = provider.getContestRoundIds(mockTasks as TaskResult[]);

      expect(ids).toContain('arc001');
      expect(ids).toContain('arc035');
      expect(ids).toContain('arc057');
    });

    test('expects to return correct header ids', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);
      const mockTasks = [
        { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
        { contest_id: 'arc001', task_id: 'arc001_2', task_table_index: 'B' },
        { contest_id: 'arc001', task_id: 'arc001_3', task_table_index: 'C' },
        { contest_id: 'arc001', task_id: 'arc001_4', task_table_index: 'D' },
      ];

      const ids = provider.getHeaderIdsForTask(mockTasks as TaskResult[]);

      expect(ids).toEqual(['A', 'B', 'C', 'D']);
    });

    test('expects to handle empty input gracefully', () => {
      const provider = new ARC001ToARC057Provider(ContestType.ARC);

      const filteredEmpty = provider.filter([] as TaskResult[]);
      const tableEmpty = provider.generateTable([] as TaskResult[]);
      const idsEmpty = provider.getContestRoundIds([] as TaskResult[]);
      const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResult[]);

      expect(filteredEmpty).toEqual([]);
      expect(tableEmpty).toEqual({});
      expect(idsEmpty).toEqual([]);
      expect(headerIdsEmpty).toEqual([]);
    });
  });

  describe('AGC 001 Onwards', () => {
    test('expects to filter tasks to include only AGC001 and later', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const filtered = provider.filter(taskResultsForAGC001OnwardsProvider);

      expect(filtered.every((task) => task.contest_id.startsWith('agc'))).toBe(true);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 1 && round <= 999;
        }),
      ).toBe(true);
    });

    test('expects to get correct metadata', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Grand Contest 001 〜 ');
      expect(metadata.abbreviationName).toBe('agc001Onwards');
    });

    test('expects to get correct display configuration', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-16');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
      expect(displayConfig.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const label = provider.getContestRoundLabel('agc001');

      expect(label).toBe('001');
    });

    test('expects to generate correct table structure', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const filtered = provider.filter(taskResultsForAGC001OnwardsProvider);
      const table = provider.generateTable(filtered);

      expect(Object.keys(table).length).toBeGreaterThan(0);
      expect(table).toHaveProperty('agc001');
      expect(table).toHaveProperty('agc002');
      expect(table).toHaveProperty('agc009');
      expect(table).toHaveProperty('agc028');
      expect(table).toHaveProperty('agc073');
      expect(table).toHaveProperty('agc074');
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const filtered = provider.filter(taskResultsForAGC001OnwardsProvider);
      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toContain('agc001');
      expect(roundIds).toContain('agc002');
      expect(roundIds).toContain('agc009');
      expect(roundIds).toContain('agc028');
      expect(roundIds).toContain('agc073');
      expect(roundIds).toContain('agc074');
      expect(roundIds.every((id) => id.startsWith('agc'))).toBe(true);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const filtered = provider.filter(taskResultsForAGC001OnwardsProvider);
      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds.length).toBeGreaterThan(0);
      expect(headerIds.every((id) => id.length > 0)).toBe(true);
    });

    test('expects to handle 4-problem contest pattern (AGC073)', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const agc073Tasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === 'agc073',
      );
      const headerIds = provider.getHeaderIdsForTask(agc073Tasks as TaskResults);

      expect(agc073Tasks).toHaveLength(4);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D']);
    });

    test('expects to handle 5-problem contest pattern (AGC009, AGC074)', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const agc009Tasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === 'agc009',
      );
      const headerIds = provider.getHeaderIdsForTask(agc009Tasks as TaskResults);

      expect(agc009Tasks).toHaveLength(5);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    test('expects to handle 6-problem contest pattern (AGC001, AGC002)', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const agc001Tasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === 'agc001',
      );
      const headerIds = provider.getHeaderIdsForTask(agc001Tasks as TaskResults);

      expect(agc001Tasks).toHaveLength(6);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });

    test('expects to handle 7-problem contest pattern with F2 (AGC028)', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const agc028Tasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === 'agc028',
      );
      const headerIds = provider.getHeaderIdsForTask(agc028Tasks as TaskResults);

      expect(agc028Tasks).toHaveLength(7);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'F2']);
    });

    test('expects to maintain proper alphabetical/numeric sort order', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const unsortedTasks = [
        { contest_id: 'agc001', task_id: 'agc001_f', task_table_index: 'F' },
        { contest_id: 'agc001', task_id: 'agc001_c', task_table_index: 'C' },
        { contest_id: 'agc001', task_id: 'agc001_a', task_table_index: 'A' },
        { contest_id: 'agc001', task_id: 'agc001_f2', task_table_index: 'F2' },
      ];
      const headerIds = provider.getHeaderIdsForTask(unsortedTasks as TaskResults);

      expect(headerIds).toEqual(['A', 'C', 'F', 'F2']);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const mixedTasks = [
        { contest_id: 'agc050', task_id: 'agc050_a', task_table_index: 'A' },
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'agc001', task_id: 'agc001_a', task_table_index: 'A' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id.startsWith('agc'))).toBe(true);
    });

    test('expects to exclude contests below AGC001', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const mixedTasks = [
        { contest_id: 'agc000', task_id: 'agc000_a', task_table_index: 'A' },
        { contest_id: 'agc001', task_id: 'agc001_a', task_table_index: 'A' },
        { contest_id: 'agc002', task_id: 'agc002_a', task_table_index: 'A' },
        { contest_id: 'agc999', task_id: 'agc999_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(3);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 1 && round <= 999;
        }),
      ).toBe(true);
    });

    test('expects to handle empty task results', () => {
      const provider = new AGC001OnwardsProvider(ContestType.AGC);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });
  });

  describe('Typical90 provider', () => {
    test('expects to filter tasks to include only typical90 contest', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const mixedTaskResults = [
        ...mockTaskResults,
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mixedTaskResults as TaskResults);

      expect(filtered?.every((task) => task.contest_id === 'typical90')).toBe(true);
      expect(filtered?.length).toBe(filtered.length);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'dp' }));
    });

    test('expects to get correct metadata', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('競プロ典型 90 問');
      expect(metadata.abbreviationName).toBe('typical90');
    });

    test('expects to get correct display configuration', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(false);
      expect(displayConfig.isShownRoundLabel).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('');
      expect(displayConfig.tableBodyCellsWidth).toBe('w-1/2 xl:w-1/3 px-1 py-2');
      expect(displayConfig.isShownTaskIndex).toBe(true);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const label = provider.getContestRoundLabel('typical90');

      expect(label).toBe('');
    });

    test('expects to generate correct table structure', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const filtered = provider.filter(mockTaskResults as TaskResults);
      const table = provider.generateTable(filtered);

      expect(table).toHaveProperty('typical90');
      expect(table.typical90).toHaveProperty('001');
      expect(table.typical90).toHaveProperty('002');
      expect(table.typical90).toHaveProperty('003');
      expect(table.typical90).toHaveProperty('010');
      expect(table.typical90).toHaveProperty('089');
      expect(table.typical90).toHaveProperty('090');
      expect(table.typical90['001']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_a' }),
      );
      expect(table.typical90['002']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_b' }),
      );
      expect(table.typical90['003']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_c' }),
      );
      expect(table.typical90['010']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_j' }),
      );
      expect(table.typical90['089']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_ck' }),
      );
      expect(table.typical90['090']).toEqual(
        expect.objectContaining({ contest_id: 'typical90', task_id: 'typical90_cl' }),
      );
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const filtered = provider.filter(mockTaskResults as TaskResults);
      const roundIds = provider.getContestRoundIds(filtered as TaskResults);

      expect(roundIds).toEqual(['typical90']);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const taskResults = [
        ...mockTaskResults,
        { contest_id: 'typical90', task_id: 'typical90_d', task_table_index: '004' },
        { contest_id: 'typical90', task_id: 'typical90_e', task_table_index: '005' },
      ];
      const filtered = provider.filter(taskResults as TaskResults);
      const headerIds = provider.getHeaderIdsForTask(filtered as TaskResults);

      expect(headerIds).toEqual(['001', '002', '003', '004', '005', '010', '089', '090']);
    });

    test('expects to handle empty task results', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new Typical90Provider(ContestType.TYPICAL90);
      const mockMixedTasks = [
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
        { contest_id: 'tdpc', task_id: 'tdpc_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mockMixedTasks as TaskResults);

      expect(filtered).toEqual([]);
    });
  });

  describe('TessokuBook provider', () => {
    test('expects to filter tasks to include only tessoku-book contest', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const mixedTasks = [
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered?.every((task) => task.contest_id === 'tessoku-book')).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
    });

    test('expects to get correct metadata', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('競技プログラミングの鉄則');
      expect(metadata.abbreviationName).toBe('tessoku-book');
    });

    test('expects to get correct display configuration', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(false);
      expect(displayConfig.isShownRoundLabel).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      );
      expect(displayConfig.isShownTaskIndex).toBe(true);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const label = provider.getContestRoundLabel('tessoku-book');

      expect(label).toBe('');
    });

    test('expects to generate correct table structure with mixed problem sources', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const tasks = [
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_al', task_table_index: 'B07' },
        { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
      ];
      const table = provider.generateTable(tasks as TaskResults);

      expect(table).toHaveProperty('tessoku-book');
      expect(table['tessoku-book']).toHaveProperty('A06');
      expect(table['tessoku-book']['A06']).toEqual(
        expect.objectContaining({ task_id: 'math_and_algorithm_ai' }),
      );
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const tasks = [
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      ];
      const roundIds = provider.getContestRoundIds(tasks as TaskResults);

      expect(roundIds).toEqual(['tessoku-book']);
    });

    test('expects to get header IDs for tasks correctly in ascending order', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const tasks = [
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_al', task_table_index: 'B07' },
        { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['A01', 'A06', 'A77', 'B07', 'B63', 'C09']);
    });

    test('expects to maintain proper sort order across all sections', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const tasks = [
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['A06', 'B63', 'C09']);
    });

    test('expects to handle section boundaries correctly (A01-A77, B01-B69, C01-C20)', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const tasks = [
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_bz', task_table_index: 'B01' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_ep', task_table_index: 'B69' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_ey', task_table_index: 'C01' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_fr', task_table_index: 'C20' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['A01', 'A77', 'B01', 'B69', 'C01', 'C20']);
    });

    test('expects to handle empty task results', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
      const mixedTasks = [
        { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
        { contest_id: 'typical90', task_id: 'typical90_b', task_table_index: 'B' },
        { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(3);
      expect(filtered?.every((task) => task.contest_id === 'tessoku-book')).toBe(true);
    });
  });

  describe('FPS24 provider', () => {
    test('expects to filter tasks to include only fps-24 contest', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const mixedTasks = [
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_b', task_table_index: 'B' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered?.every((task) => task.contest_id === 'fps-24')).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
    });

    test('expects to generate correct table structure', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const tasks = [
        { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_b', task_table_index: 'B' },
        { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
      ];
      const table = provider.generateTable(tasks as TaskResults);

      expect(table).toHaveProperty('fps-24');
      expect(table['fps-24']).toHaveProperty('A');
      expect(table['fps-24']).toHaveProperty('B');
      expect(table['fps-24']).toHaveProperty('X');
      expect(table['fps-24']['A']).toEqual(expect.objectContaining({ task_id: 'fps_24_a' }));
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const tasks = [
        { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
      ];
      const roundIds = provider.getContestRoundIds(tasks as TaskResults);

      expect(roundIds).toEqual(['fps-24']);
    });

    test('expects to get header IDs for tasks correctly in ascending order', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const tasks = [
        { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
        { contest_id: 'fps-24', task_id: 'fps_24_m', task_table_index: 'M' },
        { contest_id: 'fps-24', task_id: 'fps_24_b', task_table_index: 'B' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['A', 'B', 'M', 'X']);
    });

    test('expects to handle section boundaries correctly (A-X)', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const tasks = [
        { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
        { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['A', 'X']);
    });

    test('expects to handle empty task results', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new FPS24Provider(ContestType.FPS_24);
      const mockMixedTasks = [
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
        { contest_id: 'tdpc', task_id: 'tdpc_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mockMixedTasks as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });
  });

  describe('MathAndAlgorithm provider', () => {
    test('expects to filter tasks to include only math-and-algorithm contest', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const mixedTasks = [
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_a',
          task_table_index: '001',
        },
        { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
        { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
    });

    test('expects to get correct metadata', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('アルゴリズムと数学');
      expect(metadata.abbreviationName).toBe('math-and-algorithm');
    });

    test('expects to get correct display configuration', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(false);
      expect(displayConfig.isShownRoundLabel).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      );
      expect(displayConfig.isShownTaskIndex).toBe(true);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const label = provider.getContestRoundLabel('math-and-algorithm');

      expect(label).toBe('');
    });

    test('expects to generate correct table structure with mixed problem sources', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const tasks = [
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_a',
          task_table_index: '001',
        },
        { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
        { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
        { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
      ];
      const table = provider.generateTable(tasks as TaskResults);

      expect(table).toHaveProperty('math-and-algorithm');
      expect(table['math-and-algorithm']).toHaveProperty('028');
      expect(table['math-and-algorithm']['028']).toEqual(
        expect.objectContaining({ task_id: 'dp_a' }),
      );
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const tasks = [
        { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
        { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
      ];
      const roundIds = provider.getContestRoundIds(tasks as TaskResults);

      expect(roundIds).toEqual(['math-and-algorithm']);
    });

    test('expects to get header IDs for tasks correctly in ascending order', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const tasks = [
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_a',
          task_table_index: '001',
        },
        { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
        { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
        { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['001', '028', '036', '102']);
    });

    test('expects to maintain proper sort order with numeric indices', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const tasks = [
        { contest_id: 'math-and-algorithm', task_id: 'typical90_bz', task_table_index: '045' },
        { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['036', '045']);
    });

    test('expects to handle section boundaries correctly (001-104)', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const tasks = [
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_a',
          task_table_index: '001',
        },
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_bx',
          task_table_index: '104',
        },
      ];
      const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

      expect(headerIds).toEqual(['001', '104']);
    });

    test('expects to handle empty task results', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
      const mixedTasks = [
        {
          contest_id: 'math-and-algorithm',
          task_id: 'math_and_algorithm_a',
          task_table_index: '001',
        },
        { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered).toHaveLength(2);
      expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
    });
  });

  describe.each([
    {
      providerClass: EDPCProvider,
      contestType: ContestType.EDPC,
      title: 'Educational DP Contest / DP まとめコンテスト',
      abbreviationName: 'edpc',
      label: 'EDPC provider',
    },
    {
      providerClass: TDPCProvider,
      contestType: ContestType.TDPC,
      title: 'Typical DP Contest',
      abbreviationName: 'tdpc',
      label: 'TDPC provider',
    },
    {
      providerClass: FPS24Provider,
      contestType: ContestType.FPS_24,
      title: 'FPS 24 題',
      abbreviationName: 'fps-24',
      label: 'FPS24 provider',
    },
  ])('$label', ({ providerClass, contestType, title, abbreviationName }) => {
    test('expects to get correct metadata', () => {
      const provider = new providerClass(contestType);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.abbreviationName).toBe(abbreviationName);
    });

    test('expects to get correct display configuration', () => {
      const provider = new providerClass(contestType);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(false);
      expect(displayConfig.isShownRoundLabel).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      );
      expect(displayConfig.isShownTaskIndex).toBe(true);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new providerClass(contestType);
      const label = provider.getContestRoundLabel('');

      expect(label).toBe('');
    });
  });

  describe('ACL Practice Provider', () => {
    test('expects to filter tasks with contest_id "practice2"', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const mixed = [
        { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
        { contest_id: 'practice2', task_id: 'practice2_l', task_table_index: 'L' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      ] as TaskResults;

      const filtered = provider.filter(mixed);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((task) => task.contest_id === 'practice2')).toBe(true);
    });

    test('expects to filter only ACL_PRACTICE-type contests', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const mixed = [
        { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
        { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
      ] as TaskResults;

      const filtered = provider.filter(mixed);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].contest_id).toBe('practice2');
    });

    test('expects to return correct metadata', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Library Practice Contest');
      expect(metadata.abbreviationName).toBe('aclPractice');
    });

    test('expects to return correct display config with ACL Practice-specific settings', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(false);
      expect(config.isShownRoundLabel).toBe(false);
      expect(config.isShownTaskIndex).toBe(true);
      expect(config.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      );
      expect(config.roundLabelWidth).toBe('');
    });

    test('expects to return empty string for contest round label', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);

      expect(provider.getContestRoundLabel('practice2')).toBe('');
    });

    test('expects test data to have 12 tasks with correct properties', () => {
      expect(taskResultsForACLPracticeProvider).toHaveLength(12);
      expect(
        taskResultsForACLPracticeProvider.every((task) => task.contest_id === 'practice2'),
      ).toBe(true);

      const expectedIndices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const actualIndices = taskResultsForACLPracticeProvider.map((task) => task.task_table_index);

      expect(actualIndices).toEqual(expectedIndices);
    });

    test('expects to filter test data correctly', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const allTasks: TaskResults = [
        ...taskResultsForACLPracticeProvider,
        ...taskResultsForContestTableProvider,
      ];

      const filtered = provider.filter(allTasks);

      expect(filtered).toHaveLength(12);
      expect(filtered).toEqual(taskResultsForACLPracticeProvider);
    });

    test('expects to handle empty task results', () => {
      const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });
  });

  describe('JOI First Qual Round provider', () => {
    test('expects to filter tasks to include only JOI contests', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
        { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
        { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
        { contest_id: 'abc123', task_id: 'abc123_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
      expect(filtered?.length).toBe(4);
      expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}yo1[abc]/))).toBe(true);
    });

    test('expects to filter contests by year correctly', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
        { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
        { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
        { contest_id: 'joi2023yo1b', task_id: 'joi2023yo1b_b' },
        { contest_id: 'joi2022yo1a', task_id: 'joi2022yo1a_c' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.length).toBe(6);
      expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(3);
      expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(2);
      expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
    });

    test('expects to get correct metadata', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('JOI 一次予選');
      expect(metadata.abbreviationName).toBe('joiFirstQualRound');
    });

    test('expects to get correct display configuration', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
      expect(displayConfig.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
      expect(displayConfig.isShownTaskIndex).toBe(false);
    });

    test('expects to format contest round label correctly', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);

      expect(provider.getContestRoundLabel('joi2024yo1a')).toBe('2024 第 1 回');
      expect(provider.getContestRoundLabel('joi2024yo1b')).toBe('2024 第 2 回');
      expect(provider.getContestRoundLabel('joi2024yo1c')).toBe('2024 第 3 回');
      expect(provider.getContestRoundLabel('joi2023yo1a')).toBe('2023 第 1 回');
      expect(provider.getContestRoundLabel('joi2023yo1b')).toBe('2023 第 2 回');
      expect(provider.getContestRoundLabel('joi2023yo1c')).toBe('2023 第 3 回');
    });

    test('expects to handle invalid contest IDs gracefully', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);

      expect(provider.getContestRoundLabel('invalid-id')).toBe('invalid-id');
      expect(provider.getContestRoundLabel('joi2024yo1d')).toBe('joi2024yo1d'); // Invalid round
    });

    test('expects to generate correct table structure', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a', task_table_index: 'A' },
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_b', task_table_index: 'B' },
        { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a', task_table_index: 'A' },
        { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_c', task_table_index: 'C' },
      ];

      const table = provider.generateTable(mockJOITasks as any);

      expect(table).toHaveProperty('joi2024yo1a');
      expect(table).toHaveProperty('joi2024yo1b');
      expect(table).toHaveProperty('joi2024yo1c');
      expect(table.joi2024yo1a).toHaveProperty('A');
      expect(table.joi2024yo1a).toHaveProperty('B');
      expect(table.joi2024yo1b).toHaveProperty('A');
      expect(table.joi2024yo1c).toHaveProperty('C');
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new JOIFirstQualRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo1b', task_id: 'joi2024yo1b_a' },
        { contest_id: 'joi2024yo1c', task_id: 'joi2024yo1c_a' },
        { contest_id: 'joi2023yo1a', task_id: 'joi2023yo1a_a' },
        { contest_id: 'joi2023yo1b', task_id: 'joi2023yo1b_a' },
        { contest_id: 'joi2023yo1c', task_id: 'joi2023yo1c_a' },
      ];

      const roundIds = provider.getContestRoundIds(mockJOITasks as any);

      expect(roundIds).toContain('joi2024yo1a');
      expect(roundIds).toContain('joi2024yo1b');
      expect(roundIds).toContain('joi2024yo1c');
      expect(roundIds).toContain('joi2023yo1a');
      expect(roundIds).toContain('joi2023yo1b');
      expect(roundIds).toContain('joi2023yo1c');
    });
  });

  describe('JOI Second Qual Round 2020 Onwards provider', () => {
    test('expects to filter tasks to include only joi{YYYY}yo2 contests', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
        { contest_id: 'joi2023yo2', task_id: 'joi2023yo2_b' },
        { contest_id: 'joi2022yo2', task_id: 'joi2022yo2_c' },
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
        { contest_id: 'joi2024yo', task_id: 'joi2024yo_a' },
        { contest_id: 'abc123', task_id: 'abc123_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
      expect(filtered?.length).toBe(3);
      expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}yo2/))).toBe(true);
    });

    test('expects to filter contests by year correctly', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_b' },
        { contest_id: 'joi2023yo2', task_id: 'joi2023yo2_a' },
        { contest_id: 'joi2022yo2', task_id: 'joi2022yo2_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.length).toBe(4);
      expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(2);
      expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(1);
      expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
    });

    test('expects to get correct metadata', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('JOI 二次予選');
      expect(metadata.abbreviationName).toBe('joiSecondQualRound2020Onwards');
    });

    test('expects to get correct display configuration', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.isShownTaskIndex).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
    });

    test('expects to get contest round label', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);

      expect(provider.getContestRoundLabel('joi2024yo2')).toBe('2024');
      expect(provider.getContestRoundLabel('joi2023yo2')).toBe('2023');
    });

    test('expects to handle empty task results', () => {
      const provider = new JOISecondQualRound2020OnwardsProvider(ContestType.JOI);
      const filtered = provider.filter([] as any);

      expect(filtered).toEqual([]);
    });
  });

  describe('JOI Qual Round From 2006 To 2019 provider', () => {
    test('expects to filter tasks to include only joi{YYYY}yo contests (without yo1/yo2)', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2019yo', task_id: 'joi2019yo_a' },
        { contest_id: 'joi2018yo', task_id: 'joi2018yo_b' },
        { contest_id: 'joi2017yo', task_id: 'joi2017yo_c' },
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
        { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
        { contest_id: 'abc123', task_id: 'abc123_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
      expect(filtered?.length).toBe(3);
      expect(filtered?.every((task) => task.contest_id.match(/^joi\d{4}yo$/))).toBe(true);
    });

    test('expects to exclude yo1/yo2 variants', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2019yo', task_id: 'joi2019yo_a' },
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.length).toBe(1);
      expect(filtered?.[0].contest_id).toBe('joi2019yo');
    });

    test('expects to get correct metadata', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('JOI 予選（旧形式）');
      expect(metadata.abbreviationName).toBe('joiQualRoundFrom2006To2019');
    });

    test('expects to get correct display configuration', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.isShownTaskIndex).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
    });

    test('expects to get contest round label', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);

      expect(provider.getContestRoundLabel('joi2019yo')).toBe('2019');
      expect(provider.getContestRoundLabel('joi2018yo')).toBe('2018');
    });

    test('expects to handle empty task results', () => {
      const provider = new JOIQualRoundFrom2006To2019Provider(ContestType.JOI);
      const filtered = provider.filter([] as any);

      expect(filtered).toEqual([]);
    });
  });

  describe('JOI Semi Final Round provider', () => {
    test('expects to filter tasks to include only joi{YYYY}ho contests', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
        { contest_id: 'joi2023ho', task_id: 'joi2023ho_b' },
        { contest_id: 'joi2022ho', task_id: 'joi2022ho_c' },
        { contest_id: 'joi2024yo1a', task_id: 'joi2024yo1a_a' },
        { contest_id: 'joi2024yo2', task_id: 'joi2024yo2_a' },
        { contest_id: 'joi2024yo', task_id: 'joi2024yo_a' },
        { contest_id: 'abc123', task_id: 'abc123_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.every((task) => task.contest_id.startsWith('joi'))).toBe(true);
      expect(filtered?.length).toBe(3);
      expect(filtered?.every((task) => task.contest_id.match(/joi\d{4}ho/))).toBe(true);
    });

    test('expects to filter contests by year correctly', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
      const mockJOITasks = [
        { contest_id: 'joi2024ho', task_id: 'joi2024ho_a' },
        { contest_id: 'joi2024ho', task_id: 'joi2024ho_b' },
        { contest_id: 'joi2023ho', task_id: 'joi2023ho_a' },
        { contest_id: 'joi2022ho', task_id: 'joi2022ho_a' },
      ];

      const filtered = provider.filter(mockJOITasks as any);

      expect(filtered?.length).toBe(4);
      expect(filtered?.filter((task) => task.contest_id.includes('2024')).length).toBe(2);
      expect(filtered?.filter((task) => task.contest_id.includes('2023')).length).toBe(1);
      expect(filtered?.filter((task) => task.contest_id.includes('2022')).length).toBe(1);
    });

    test('expects to get correct metadata', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('JOI 本選');
      expect(metadata.abbreviationName).toBe('joiSemiFinalRound');
    });

    test('expects to get correct display configuration', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.isShownTaskIndex).toBe(false);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
      expect(displayConfig.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 px-1 py-1');
    });

    test('expects to get contest round label', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);

      expect(provider.getContestRoundLabel('joi2024ho')).toBe('2024');
      expect(provider.getContestRoundLabel('joi2023ho')).toBe('2023');
    });

    test('expects to handle empty task results', () => {
      const provider = new JOISemiFinalRoundProvider(ContestType.JOI);
      const filtered = provider.filter([] as any);

      expect(filtered).toEqual([]);
    });
  });

  describe('Common provider functionality', () => {
    test('expects to get contest round IDs correctly', () => {
      const provider = new ABSProvider(ContestType.ABS);
      // Use a subset of the mock data that covers the relevant contest IDs
      const filtered = taskResultsForABS.filter((task) => ['abs'].includes(task.contest_id));

      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toEqual(['abs']);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const filtered = taskResultsForABS.filter((task) => task.contest_id === 'abs');
      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
    });
  });
});

describe('ContestTableProviderGroup', () => {
  test('expects to create a group with metadata correctly', () => {
    const group = new ContestTableProviderGroup('only metadata', {
      buttonLabel: '',
      ariaLabel: 'only metadata',
    });

    expect(group.getGroupName()).toBe('only metadata');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '',
      ariaLabel: 'only metadata',
    });
    expect(group.getSize()).toBe(0);
  });

  test('expects to add a single provider correctly', () => {
    const group = new ContestTableProviderGroup('AtCoder Beginners Selection', {
      buttonLabel: 'ABS',
      ariaLabel: 'Filter AtCoder Beginners Selection',
    });
    const provider = new ABSProvider(ContestType.ABS);

    group.addProvider(provider);

    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABS)).toBe(provider);
    expect(group.getProvider(ContestType.OTHERS)).toBeUndefined();
  });

  test('expects to add multiple providers correctly', () => {
    const group = new ContestTableProviderGroup('EDPC・TDPC', {
      buttonLabel: 'EDPC・TDPC',
      ariaLabel: 'EDPC and TDPC contests',
    });
    const edpcProvider = new EDPCProvider(ContestType.EDPC);
    const tdpcProvider = new TDPCProvider(ContestType.TDPC);

    group.addProviders(edpcProvider, tdpcProvider);

    expect(group.getSize()).toBe(2);
    expect(group.getProvider(ContestType.EDPC)).toBe(edpcProvider);
    expect(group.getProvider(ContestType.TDPC)).toBe(tdpcProvider);
  });

  test('expects to get all providers correctly', () => {
    const group = new ContestTableProviderGroup('Algorithm Training Pack', {
      buttonLabel: 'アルゴリズム練習パック',
      ariaLabel: 'Filter algorithm training contests',
    });
    const edpcProvider = new EDPCProvider(ContestType.EDPC);
    const tdpcProvider = new TDPCProvider(ContestType.TDPC);

    group.addProvider(edpcProvider);
    group.addProvider(tdpcProvider);

    const allProviders = group.getAllProviders();
    expect(allProviders).toHaveLength(2);
    expect(allProviders).toContain(edpcProvider);
    expect(allProviders).toContain(tdpcProvider);
  });

  test('expects to return method chaining correctly', () => {
    const group = new ContestTableProviderGroup('Collection for beginner', {
      buttonLabel: '初心者向けセット',
      ariaLabel: 'Filter contests for beginner',
    });
    const absProvider = new ABSProvider(ContestType.ABS);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    const result = group.addProvider(absProvider).addProvider(edpcProvider);

    expect(result).toBe(group);
    expect(group.getSize()).toBe(2);
  });

  test('expects to get group statistics correctly', () => {
    const group = new ContestTableProviderGroup('Statistics for contest table', {
      buttonLabel: 'コンテストテーブルに関する統計情報',
      ariaLabel: 'Statistics for contest table',
    });
    const abcProvider = new ABSProvider(ContestType.ABC);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    group.addProvider(abcProvider);
    group.addProvider(edpcProvider);

    const stats = group.getStats();

    expect(stats.groupName).toBe('Statistics for contest table');
    expect(stats.providerCount).toBe(2);
    expect(stats.providers).toHaveLength(2);
    expect(stats.providers[0]).toHaveProperty('providerKey');
    expect(stats.providers[0]).toHaveProperty('metadata');
    expect(stats.providers[0]).toHaveProperty('displayConfig');
  });

  describe('Provider key functionality', () => {
    test('expects createProviderKey to generate correct simple key', () => {
      const key = ContestTableProviderBase.createProviderKey(ContestType.ABC);
      expect(key).toBe('ABC');
      // Verify key type is ProviderKey (string-based)
      expect(typeof key).toBe('string');
    });

    test('expects createProviderKey to generate correct composite key with section', () => {
      const key = ContestTableProviderBase.createProviderKey(
        ContestType.TESSOKU_BOOK,
        TESSOKU_SECTIONS.EXAMPLES,
      );
      expect(key).toBe(`TESSOKU_BOOK::${TESSOKU_SECTIONS.EXAMPLES}`);
      // Verify key contains section separator
      expect(key).toContain('::');
    });

    test('expects TessokuBook providers to have correct keys', () => {
      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      const practicalsProvider = new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK);
      const challengesProvider = new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK);

      expect(examplesProvider.getProviderKey()).toBe(`TESSOKU_BOOK::${TESSOKU_SECTIONS.EXAMPLES}`);
      expect(practicalsProvider.getProviderKey()).toBe(
        `TESSOKU_BOOK::${TESSOKU_SECTIONS.PRACTICALS}`,
      );
      expect(challengesProvider.getProviderKey()).toBe(
        `TESSOKU_BOOK::${TESSOKU_SECTIONS.CHALLENGES}`,
      );
    });

    test('expects multiple TessokuBook providers to be stored separately in group', () => {
      const group = new ContestTableProviderGroup('Tessoku Book', {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      });

      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      const practicalsProvider = new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK);
      const challengesProvider = new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK);

      group.addProviders(examplesProvider, practicalsProvider, challengesProvider);

      expect(group.getSize()).toBe(3);
      expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBeInstanceOf(
        TessokuBookForExamplesProvider,
      );
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS),
      ).toBeInstanceOf(TessokuBookForPracticalsProvider);
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.CHALLENGES),
      ).toBeInstanceOf(TessokuBookForChallengesProvider);
    });

    test('expects backward compatibility for getProvider without section', () => {
      const group = new ContestTableProviderGroup('AtCoder Beginners Selection', {
        buttonLabel: 'ABS',
        ariaLabel: 'Filter AtCoder Beginners Selection',
      });

      const absProvider = new ABSProvider(ContestType.ABS);
      group.addProvider(absProvider);

      // Get provider without section should work with simple key
      expect(group.getProvider(ContestType.ABS)).toBe(absProvider);
      expect(group.getProvider(ContestType.ABS, undefined)).toBe(absProvider);
    });

    test('expects getProvider with non-existent section to return undefined', () => {
      const group = new ContestTableProviderGroup('Tessoku Book', {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      });

      const examplesProvider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
      group.addProvider(examplesProvider);

      expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBe(
        examplesProvider,
      );
      expect(
        group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS),
      ).toBeUndefined();
      expect(group.getProvider(ContestType.TESSOKU_BOOK, 'invalid')).toBeUndefined();
    });
  });
});

describe('prepareContestProviderPresets', () => {
  test('expects to create ABS preset correctly', () => {
    const group = prepareContestProviderPresets().ABS();

    expect(group.getGroupName()).toBe('AtCoder Beginners Selection');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABS',
      ariaLabel: 'Filter AtCoder Beginners Selection',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABS)).toBeInstanceOf(ABSProvider);
  });

  test('expects to create ABC319Onwards preset correctly', () => {
    const group = prepareContestProviderPresets().ABC319Onwards();

    expect(group.getGroupName()).toBe('ABC 319 Onwards');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 319 〜 ',
      ariaLabel: 'Filter contests from ABC 319 onwards',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC319OnwardsProvider);
  });

  test('expects to create fromABC212ToABC318 preset correctly', () => {
    const group = prepareContestProviderPresets().ABC212ToABC318();

    expect(group.getGroupName()).toBe('From ABC 212 to ABC 318');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 212 〜 318',
      ariaLabel: 'Filter contests from ABC 212 to ABC 318',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC212ToABC318Provider);
  });

  test('expects to create DPs preset correctly', () => {
    const group = prepareContestProviderPresets().dps();

    expect(group.getGroupName()).toBe('EDPC・TDPC・FPS 24');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'EDPC・TDPC・FPS 24',
      ariaLabel: 'EDPC and TDPC and FPS 24 contests',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.EDPC)).toBeInstanceOf(EDPCProvider);
    expect(group.getProvider(ContestType.TDPC)).toBeInstanceOf(TDPCProvider);
    expect(group.getProvider(ContestType.FPS_24)).toBeInstanceOf(FPS24Provider);
  });

  test('expects to create Typical90 preset correctly', () => {
    const group = prepareContestProviderPresets().Typical90();

    expect(group.getGroupName()).toBe('競プロ典型 90 問');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '競プロ典型 90 問',
      ariaLabel: 'Filter Typical 90 Problems',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.TYPICAL90)).toBeInstanceOf(Typical90Provider);
  });

  test('expects to create TessokuBook preset correctly with 3 providers', () => {
    const group = prepareContestProviderPresets().TessokuBook();

    expect(group.getGroupName()).toBe('競技プログラミングの鉄則');
    expect(group.getMetadata()).toEqual({
      buttonLabel: '競技プログラミングの鉄則',
      ariaLabel: 'Filter Tessoku Book',
    });
    expect(group.getSize()).toBe(3);
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.EXAMPLES)).toBeInstanceOf(
      TessokuBookForExamplesProvider,
    );
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.PRACTICALS)).toBeInstanceOf(
      TessokuBookForPracticalsProvider,
    );
    expect(group.getProvider(ContestType.TESSOKU_BOOK, TESSOKU_SECTIONS.CHALLENGES)).toBeInstanceOf(
      TessokuBookForChallengesProvider,
    );
  });

  test('expects to verify all presets are functions', () => {
    const presets = prepareContestProviderPresets();

    expect(typeof presets.ABS).toBe('function');
    expect(typeof presets.ABC319Onwards).toBe('function');
    expect(typeof presets.ABC212ToABC318).toBe('function');
    expect(typeof presets.Typical90).toBe('function');
    expect(typeof presets.dps).toBe('function');
  });

  test('expects each preset to create independent instances', () => {
    const presets = prepareContestProviderPresets();
    const group1 = presets.ABS();
    const group2 = presets.ABS();

    expect(group1).not.toBe(group2);
    expect(group1.getGroupName()).toBe(group2.getGroupName());
    expect(group1.getProvider(ContestType.ABS)).not.toBe(group2.getProvider(ContestType.ABS));
  });
});
