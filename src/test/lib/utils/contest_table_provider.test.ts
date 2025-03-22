import { describe, test, expect, vi } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import { contestTableProviders } from '$lib/utils/contest_table_provider';
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

  describe('ABC latest 20 rounds provider', () => {
    test('expects to filter tasks to include only ABC contests', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const filtered = provider.filter(mockTaskResults);

      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'arc100' }));
    });

    test('expects to limit results to the latest 20 rounds', () => {
      const provider = contestTableProviders.abcLatest20Rounds;

      const largeDataset = [...mockTaskResults];
      const filtered = provider.filter(largeDataset);
      const uniqueContests = new Set(filtered.map((task) => task.contest_id));

      expect(uniqueContests.size).toBeLessThanOrEqual(20);
    });

    test('expects to generate correct table structure', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const filtered = provider.filter(mockTaskResults);
      const table = provider.generateTable(filtered);

      expect(table).toHaveProperty('abc378');
      expect(table.abc378).toHaveProperty('G');
      expect(table.abc378.G).toEqual(
        expect.objectContaining({ contest_id: 'abc378', task_id: 'abc378_g' }),
      );
    });

    test('expects to get correct metadata', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 最新 20 回');
      expect(metadata.buttonLabel).toBe('ABC 最新 20 回');
      expect(metadata.ariaLabel).toBe('Filter ABC latest 20 rounds');
    });

    test('expects to format contest round label correctly', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const label = provider.getContestRoundLabel('abc378');

      expect(label).toBe('378');
    });
  });

  describe('ABC319 onwards provider', () => {
    test('expects to filter tasks to include only ABC319 and later', () => {
      const provider = contestTableProviders.abc319Onwards;
      const filtered = provider.filter(mockTaskResults);

      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
      expect(
        filtered.every((task) => {
          const round = parseInt(task.contest_id.replace('abc', ''), 10);
          return round >= 319 && round <= 999;
        }),
      ).toBeTruthy();
    });

    test('expects to get correct metadata', () => {
      const provider = contestTableProviders.abc319Onwards;
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 319 〜 ');
      expect(metadata.buttonLabel).toBe('ABC 319 〜 ');
      expect(metadata.ariaLabel).toBe('Filter contests from ABC 319 onwards');
    });

    test('expects to format contest round label correctly', () => {
      const provider = contestTableProviders.abc319Onwards;
      const label = provider.getContestRoundLabel('abc397');

      expect(label).toBe('397');
    });
  });

  describe('ABC212 to ABC318 provider', () => {
    test('expects to filter tasks to include only ABC between 212 and 318', () => {
      const provider = contestTableProviders.fromAbc212ToAbc318;
      const filtered = provider.filter(mockTaskResults);

      expect(filtered.every((task) => task.contest_id.startsWith('abc'))).toBeTruthy();
      expect(
        filtered.every((task) => {
          const round = parseInt(task.contest_id.replace('abc', ''), 10);
          return round >= 212 && round <= 318;
        }),
      ).toBeTruthy();
    });

    test('expects to get correct metadata', () => {
      const provider = contestTableProviders.fromAbc212ToAbc318;
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginner Contest 212 〜 318');
      expect(metadata.buttonLabel).toBe('ABC 212 〜 318');
      expect(metadata.ariaLabel).toBe('Filter contests from ABC 212 to ABC 318');
    });

    test('expects to format contest round label correctly', () => {
      const provider = contestTableProviders.fromAbc212ToAbc318;
      const label = provider.getContestRoundLabel('abc318');

      expect(label).toBe('318');
    });
  });

  describe('Common provider functionality', () => {
    test('expects to get contest round IDs correctly', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const filtered = [
        { contest_id: 'abc397', task_id: 'a', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'a', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'b', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'c', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'e', status_name: 'ac_with_editorial' },
        { contest_id: 'abc319', task_id: 'f', status_name: 'wa' },
        { contest_id: 'abc319', task_id: 'g', status_name: 'ns' },
        { contest_id: 'abc318', task_id: 'a', status_name: 'ac' },
      ] as TaskResults;

      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toEqual(['abc397', 'abc319', 'abc318']);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = contestTableProviders.abcLatest20Rounds;
      const filtered = [
        { contest_id: 'abc319', task_id: 'abc319_a', task_table_index: 'A', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'abc319_b', task_table_index: 'B', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'abc319_c', task_table_index: 'C', status_name: 'ac' },
        { contest_id: 'abc319', task_id: 'abc319_d', task_table_index: 'D', status_name: 'ac' },
        {
          contest_id: 'abc319',
          task_id: 'abc319_e',
          task_table_index: 'E',
          status_name: 'ac_with_editorial',
        },
        { contest_id: 'abc319', task_id: 'abc319_f', task_table_index: 'F', status_name: 'wa' },
        { contest_id: 'abc319', task_id: 'abc319_g', task_table_index: 'G', status_name: 'ns' },
      ] as TaskResults;

      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });
  });
});
