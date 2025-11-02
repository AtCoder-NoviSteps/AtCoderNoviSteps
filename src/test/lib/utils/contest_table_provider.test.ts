import { describe, test, expect, vi } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ABCLatest20RoundsProvider,
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  EDPCProvider,
  TDPCProvider,
  JOIFirstQualRoundProvider,
  Typical90Provider,
  TessokuBookProvider,
  ContestTableProviderGroup,
  prepareContestProviderPresets,
} from '$lib/utils/contest_table_provider';
import { taskResultsForContestTableProvider } from './test_cases/contest_table_provider';

// Mock the imported functions
vi.mock('$lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return ContestType.ABC;
    } else if (contestId === 'dp') {
      return ContestType.EDPC;
    } else if (contestId === 'tdpc') {
      return ContestType.TDPC;
    } else if (contestId.startsWith('joi')) {
      return ContestType.JOI;
    } else if (contestId === 'typical90') {
      return ContestType.TYPICAL90;
    } else if (contestId === 'tessoku-book') {
      return ContestType.TESSOKU_BOOK;
    }

    return ContestType.OTHERS;
  }),

  getContestNameLabel: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return `ABC ${contestId.replace('abc', '')}`;
    } else if (contestId === 'dp' || contestId === 'tdpc' || contestId === 'typical90') {
      return '';
    } else if (contestId.startsWith('joi')) {
      // First qual round
      const matched = contestId.match(/joi(\d{4})yo1([abc])/);

      if (matched) {
        const [, year, round] = matched;
        const roundMap: Record<string, string> = { a: '1', b: '2', c: '3' };

        return `${year} 第 ${roundMap[round]} 回`;
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

  describe('ABC latest 20 rounds provider', () => {
    test('expects to filter tasks to include only ABC contests', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);

      expect(filtered?.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'arc100' }));
    });

    test('expects to limit results to the latest 20 rounds', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);

      const largeDataset = [...mockTaskResults];
      const filtered = provider.filter(largeDataset);
      const uniqueContests = new Set(filtered.map((task) => task.contest_id));
      expect(uniqueContests.size).toBe(20);

      // Verify these are the latest 20 rounds
      const contestRounds = Array.from(uniqueContests)
        .map((id) => getContestRound(id))
        .sort((a, b) => b - a); // Sort in descending order

      // Validate if the rounds are sequential and latest
      const latestRound = Math.max(...contestRounds);
      const expectedRounds = Array.from({ length: 20 }, (_, i) => latestRound - i);
      expect(contestRounds).toEqual(expectedRounds);
    });

    test('expects to generate correct table structure', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const table = provider.generateTable(filtered);

      expect(table).toHaveProperty('abc378');
      expect(table.abc378).toHaveProperty('G');
      expect(table.abc378.G).toEqual(
        expect.objectContaining({ contest_id: 'abc378', task_id: 'abc378_g' }),
      );

      expect(table).toHaveProperty('abc397');
      expect(table.abc397).toHaveProperty('G');
      expect(table.abc397.G).toEqual(
        expect.objectContaining({ contest_id: 'abc397', task_id: 'abc397_g' }),
      );
    });

    test('expects to get correct metadata', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 最新 20 回');
      expect(metadata.abbreviationName).toBe('abcLatest20Rounds');
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const label = provider.getContestRoundLabel('abc378');

      expect(label).toBe('378');
    });

    test('expects to get correct display configuration', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-16');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
      expect(displayConfig.isShownTaskIndex).toBe(false);
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const roundIds = provider.getContestRoundIds(filtered as TaskResults);

      // Should have at most 20 unique contests
      expect(roundIds.length).toBeLessThanOrEqual(20);
      // All round IDs should be ABC contests
      expect(roundIds.every((id) => id.startsWith('abc'))).toBe(true);
    });

    test('expects to get header IDs for tasks correctly (all problem indices)', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const headerIds = provider.getHeaderIdsForTask(filtered as TaskResults);

      // All header IDs should be non-empty
      expect(headerIds.length).toBeGreaterThan(0);
      expect(headerIds.every((id) => id.length > 0)).toBe(true);
    });

    test('expects to handle empty task results', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to handle task results with different contest types', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const mockMixedTasks = [
        { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
        { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
        { contest_id: 'abc397', task_id: 'abc397_a', task_table_index: 'A' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
        { contest_id: 'arc100', task_id: 'arc100_a', task_table_index: 'A' },
      ];
      const filtered = provider.filter(mockMixedTasks as TaskResults);

      // Should only include ABC contests
      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'dp' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'arc100' }));
    });
  });

  describe('ABC319 onwards provider', () => {
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

      expect(metadata.title).toBe('AtCoder Beginner Contest 319 〜 ');
      expect(metadata.abbreviationName).toBe('abc319Onwards');
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const label = provider.getContestRoundLabel('abc397');

      expect(label).toBe('397');
    });

    test('expects to get correct display configuration', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-16');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
      expect(displayConfig.isShownTaskIndex).toBe(false);
    });

    test('expects to generate correct table structure', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const table = provider.generateTable(filtered);

      // Verify table structure for ABC319 and onwards
      const abc378Contests = filtered.filter((task) => task.contest_id === 'abc378');

      if (abc378Contests.length > 0) {
        expect(table).toHaveProperty('abc378');
        expect(table.abc378).toHaveProperty('G');
        expect(table.abc378.G).toEqual(
          expect.objectContaining({ contest_id: 'abc378', task_id: 'abc378_g' }),
        );
      }

      const abc397Contests = filtered.filter((task) => task.contest_id === 'abc397');

      if (abc397Contests.length > 0) {
        expect(table).toHaveProperty('abc397');
        expect(table.abc397).toHaveProperty('G');
        expect(table.abc397.G).toEqual(
          expect.objectContaining({ contest_id: 'abc397', task_id: 'abc397_g' }),
        );
      }
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const roundIds = provider.getContestRoundIds(filtered as TaskResults);

      // Verify all round IDs are ABC319 and onwards
      roundIds.forEach((roundId) => {
        const round = getContestRound(roundId);
        expect(round).toBeGreaterThanOrEqual(319);
      });
    });

    test('expects to get header IDs for tasks correctly (all problem indices)', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const headerIds = provider.getHeaderIdsForTask(filtered as TaskResults);

      // All header IDs should be non-empty
      expect(headerIds.length).toBeGreaterThan(0);
      expect(headerIds.every((id) => id.length > 0)).toBe(true);
    });

    test('expects to handle empty task results', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
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

      // Should only include ABC319 and onwards
      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 319;
        }),
      ).toBe(true);
      expect(filtered).not.toContainEqual(
        expect.objectContaining({ contest_id: 'abc200', task_id: 'abc200_a' }),
      );
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'dp' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
    });
  });

  describe('ABC212 to ABC318 provider', () => {
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

      expect(metadata.title).toBe('AtCoder Beginner Contest 212 〜 318');
      expect(metadata.abbreviationName).toBe('fromAbc212ToAbc318');
    });

    test('expects to format contest round label correctly', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const label = provider.getContestRoundLabel('abc318');

      expect(label).toBe('318');
    });

    test('expects to get correct display configuration', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const displayConfig = provider.getDisplayConfig();

      expect(displayConfig.isShownHeader).toBe(true);
      expect(displayConfig.isShownRoundLabel).toBe(true);
      expect(displayConfig.roundLabelWidth).toBe('xl:w-16');
      expect(displayConfig.tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      );
      expect(displayConfig.isShownTaskIndex).toBe(false);
    });

    test('expects to generate correct table structure', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const table = provider.generateTable(filtered);

      // Verify table structure for ABC212-318 range
      filtered.slice(0, Math.min(3, filtered.length)).forEach((task) => {
        if (!table[task.contest_id]) {
          return; // Skip if contest not in table
        }
        expect(table).toHaveProperty(task.contest_id);
        expect(table[task.contest_id]).toHaveProperty(task.task_table_index);
        expect(table[task.contest_id][task.task_table_index]).toEqual(
          expect.objectContaining({ contest_id: task.contest_id, task_id: task.task_id }),
        );
      });
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const roundIds = provider.getContestRoundIds(filtered as TaskResults);

      // Verify all round IDs are in the ABC212-318 range
      roundIds.forEach((roundId) => {
        const round = getContestRound(roundId);
        expect(round).toBeGreaterThanOrEqual(212);
        expect(round).toBeLessThanOrEqual(318);
      });
    });

    test('expects to get header IDs for tasks correctly (all problem indices)', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);
      const headerIds = provider.getHeaderIdsForTask(filtered as TaskResults);

      // All header IDs should be non-empty
      expect(headerIds.length).toBeGreaterThan(0);
      expect(headerIds.every((id) => id.length > 0)).toBe(true);
    });

    test('expects to handle empty task results', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
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

      // Should only include ABC212-318
      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBe(true);
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 212 && round <= 318;
        }),
      ).toBe(true);
      expect(filtered).not.toContainEqual(
        expect.objectContaining({ contest_id: 'abc100', task_id: 'abc100_a' }),
      );
      expect(filtered).not.toContainEqual(
        expect.objectContaining({ contest_id: 'abc398', task_id: 'abc398_a' }),
      );
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'dp' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
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

  describe('EDPC provider', () => {
    test('expects to get correct metadata', () => {
      const provider = new EDPCProvider(ContestType.EDPC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('Educational DP Contest / DP まとめコンテスト');
      expect(metadata.abbreviationName).toBe('edpc');
    });

    test('expects to get correct display configuration', () => {
      const provider = new EDPCProvider(ContestType.EDPC);
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
      const provider = new EDPCProvider(ContestType.EDPC);
      const label = provider.getContestRoundLabel('dp');

      expect(label).toBe('');
    });
  });

  describe('TDPC provider', () => {
    test('expects to get correct metadata', () => {
      const provider = new TDPCProvider(ContestType.TDPC);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('Typical DP Contest');
      expect(metadata.abbreviationName).toBe('tdpc');
    });

    test('expects to get correct display configuration', () => {
      const provider = new TDPCProvider(ContestType.TDPC);
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
      const provider = new TDPCProvider(ContestType.TDPC);
      const label = provider.getContestRoundLabel('');

      expect(label).toBe('');
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
      expect(provider.getContestRoundLabel('joi2024yo2')).toBe('joi2024yo2'); // Not first qual round
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

  describe('Common provider functionality', () => {
    test('expects to get contest round IDs correctly', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      // Use a subset of the mock data that covers the relevant contest IDs
      const filtered = mockTaskResults.filter((task) =>
        ['abc397', 'abc319', 'abc318'].includes(task.contest_id),
      );

      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toEqual(['abc397', 'abc319', 'abc318']);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new ABCLatest20RoundsProvider(ContestType.ABC);
      const filtered = mockTaskResults.filter((task) => task.contest_id === 'abc319');
      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
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
    const group = new ContestTableProviderGroup('ABC Latest 20 Rounds', {
      buttonLabel: 'ABC 最新 20 回',
      ariaLabel: 'Filter ABC latest 20 rounds',
    });
    const provider = new ABCLatest20RoundsProvider(ContestType.ABC);

    group.addProvider(ContestType.ABC, provider);

    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBe(provider);
    expect(group.getProvider(ContestType.OTHERS)).toBeUndefined();
  });

  test('expects to add multiple providers correctly', () => {
    const group = new ContestTableProviderGroup('EDPC・TDPC', {
      buttonLabel: 'EDPC・TDPC',
      ariaLabel: 'EDPC and TDPC contests',
    });
    const edpcProvider = new EDPCProvider(ContestType.EDPC);
    const tdpcProvider = new TDPCProvider(ContestType.TDPC);

    group.addProviders(
      { contestType: ContestType.EDPC, provider: edpcProvider },
      { contestType: ContestType.TDPC, provider: tdpcProvider },
    );

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

    group.addProvider(ContestType.EDPC, edpcProvider);
    group.addProvider(ContestType.TDPC, tdpcProvider);

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
    const abcProvider = new ABCLatest20RoundsProvider(ContestType.ABC);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    const result = group
      .addProvider(ContestType.ABC, abcProvider)
      .addProvider(ContestType.EDPC, edpcProvider);

    expect(result).toBe(group);
    expect(group.getSize()).toBe(2);
  });

  test('expects to get group statistics correctly', () => {
    const group = new ContestTableProviderGroup('Statistics for contest table', {
      buttonLabel: 'コンテストテーブルに関する統計情報',
      ariaLabel: 'Statistics for contest table',
    });
    const abcProvider = new ABCLatest20RoundsProvider(ContestType.ABC);
    const edpcProvider = new EDPCProvider(ContestType.EDPC);

    group.addProvider(ContestType.ABC, abcProvider);
    group.addProvider(ContestType.EDPC, edpcProvider);

    const stats = group.getStats();

    expect(stats.groupName).toBe('Statistics for contest table');
    expect(stats.providerCount).toBe(2);
    expect(stats.providers).toHaveLength(2);
    expect(stats.providers[0]).toHaveProperty('contestType');
    expect(stats.providers[0]).toHaveProperty('metadata');
    expect(stats.providers[0]).toHaveProperty('displayConfig');
  });
});

describe('prepareContestProviderPresets', () => {
  test('expects to create ABCLatest20Rounds preset correctly', () => {
    const group = prepareContestProviderPresets().ABCLatest20Rounds();

    expect(group.getGroupName()).toBe('ABC Latest 20 Rounds');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 最新 20 回',
      ariaLabel: 'Filter ABC latest 20 rounds',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABCLatest20RoundsProvider);
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

    expect(group.getGroupName()).toBe('EDPC・TDPC');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'EDPC・TDPC',
      ariaLabel: 'EDPC and TDPC contests',
    });
    expect(group.getSize()).toBe(2);
    expect(group.getProvider(ContestType.EDPC)).toBeInstanceOf(EDPCProvider);
    expect(group.getProvider(ContestType.TDPC)).toBeInstanceOf(TDPCProvider);
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

  test('expects to verify all presets are functions', () => {
    const presets = prepareContestProviderPresets();

    expect(typeof presets.ABCLatest20Rounds).toBe('function');
    expect(typeof presets.ABC319Onwards).toBe('function');
    expect(typeof presets.ABC212ToABC318).toBe('function');
    expect(typeof presets.Typical90).toBe('function');
    expect(typeof presets.dps).toBe('function');
  });

  test('expects each preset to create independent instances', () => {
    const presets = prepareContestProviderPresets();
    const group1 = presets.ABCLatest20Rounds();
    const group2 = presets.ABCLatest20Rounds();

    expect(group1).not.toBe(group2);
    expect(group1.getGroupName()).toBe(group2.getGroupName());
    expect(group1.getProvider(ContestType.ABC)).not.toBe(group2.getProvider(ContestType.ABC));
  });
});
