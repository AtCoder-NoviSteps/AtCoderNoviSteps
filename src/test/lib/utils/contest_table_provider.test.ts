import { describe, test, expect, vi } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ABCLatest20RoundsProvider,
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  EDPCProvider,
  TDPCProvider,
  ContestTableProviderGroup,
  ContestProviderBuilder,
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
    }

    return ContestType.OTHERS;
  }),

  getContestNameLabel: vi.fn((contestId: string) => {
    if (contestId.startsWith('abc')) {
      return `ABC ${contestId.replace('abc', '')}`;
    } else if (contestId === 'dp' || contestId === 'tdpc') {
      return '';
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
    });

    test('expects to format contest round label correctly', () => {
      const provider = new TDPCProvider(ContestType.TDPC);
      const label = provider.getContestRoundLabel('');

      expect(label).toBe('');
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

describe('ContestProviderBuilder', () => {
  test('expects to create ABCLatest20Rounds preset correctly', () => {
    const group = ContestProviderBuilder.createPresets().ABCLatest20Rounds();

    expect(group.getGroupName()).toBe('ABC Latest 20 Rounds');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 最新 20 回',
      ariaLabel: 'Filter ABC latest 20 rounds',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABCLatest20RoundsProvider);
  });

  test('expects to create ABC319Onwards preset correctly', () => {
    const group = ContestProviderBuilder.createPresets().ABC319Onwards();

    expect(group.getGroupName()).toBe('ABC 319 Onwards');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 319 〜 ',
      ariaLabel: 'Filter contests from ABC 319 onwards',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC319OnwardsProvider);
  });

  test('expects to create fromABC212ToABC318 preset correctly', () => {
    const group = ContestProviderBuilder.createPresets().ABC212ToABC318();

    expect(group.getGroupName()).toBe('From ABC 212 to ABC 318');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'ABC 212 〜 318',
      ariaLabel: 'Filter contests from ABC 212 to ABC 318',
    });
    expect(group.getSize()).toBe(1);
    expect(group.getProvider(ContestType.ABC)).toBeInstanceOf(ABC212ToABC318Provider);
  });

  test('expects to create DPs preset correctly', () => {
    const group = ContestProviderBuilder.createPresets().dps();

    expect(group.getGroupName()).toBe('EDPC・TDPC');
    expect(group.getMetadata()).toEqual({
      buttonLabel: 'EDPC・TDPC',
      ariaLabel: 'EDPC and TDPC contests',
    });
    expect(group.getSize()).toBe(2);
    expect(group.getProvider(ContestType.EDPC)).toBeInstanceOf(EDPCProvider);
    expect(group.getProvider(ContestType.TDPC)).toBeInstanceOf(TDPCProvider);
  });

  test('expects to verify all presets are functions', () => {
    const presets = ContestProviderBuilder.createPresets();

    expect(typeof presets.ABCLatest20Rounds).toBe('function');
    expect(typeof presets.ABC319Onwards).toBe('function');
    expect(typeof presets.ABC212ToABC318).toBe('function');
    expect(typeof presets.dps).toBe('function');
  });

  test('expects each preset to create independent instances', () => {
    const presets = ContestProviderBuilder.createPresets();
    const group1 = presets.ABCLatest20Rounds();
    const group2 = presets.ABCLatest20Rounds();

    expect(group1).not.toBe(group2);
    expect(group1.getGroupName()).toBe(group2.getGroupName());
    expect(group1.getProvider(ContestType.ABC)).not.toBe(group2.getProvider(ContestType.ABC));
  });
});
