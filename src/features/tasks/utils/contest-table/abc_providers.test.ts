import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ABC319OnwardsProvider,
  ABC212ToABC318Provider,
  ABC126ToABC211Provider,
  ABC042ToABC125Provider,
  ABC001ToABC041Provider,
} from './abc_providers';
import { taskResultsForContestTableProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

const getContestRound = (contestId: string): number => {
  const roundString = contestId.replace(/^\D+/, '');
  const round = parseInt(roundString, 10);

  if (isNaN(round)) {
    throw new Error(`Invalid contest ID format: ${contestId}`);
  }

  return round;
};

describe('ABC providers', () => {
  const mockTaskResults: TaskResults = taskResultsForContestTableProvider;

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
});
