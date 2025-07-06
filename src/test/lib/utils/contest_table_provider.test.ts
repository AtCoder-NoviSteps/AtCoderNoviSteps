import { describe, test, expect, vi } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ABCLatest20RoundsProvider,
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
} from '$lib/utils/contest_table_provider';
import { taskResultsForContestTableProvider } from './test_cases/contest_table_provider';

// Mock the imported functions
vi.mock('$lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return ContestType.ABC;
    }

    return ContestType.OTHERS;
  }),

  getContestNameLabel: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return `ABC ${contestId.replace('abc', '')}`;
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

      expect(filtered?.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
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
  });

  describe('ABC319 onwards provider', () => {
    test('expects to filter tasks to include only ABC319 and later', () => {
      const provider = new ABC319OnwardsProvider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);

      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 319 && round <= 999;
        }),
      ).toBeTruthy();
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
  });

  describe('ABC212 to ABC318 provider', () => {
    test('expects to filter tasks to include only ABC between 212 and 318', () => {
      const provider = new ABC212ToABC318Provider(ContestType.ABC);
      const filtered = provider.filter(mockTaskResults);

      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
      expect(
        filtered.every((task) => {
          const round = getContestRound(task.contest_id);
          return round >= 212 && round <= 318;
        }),
      ).toBeTruthy();
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
