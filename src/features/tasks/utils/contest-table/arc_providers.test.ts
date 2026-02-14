import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';

import {
  ARC104OnwardsProvider,
  ARC058ToARC103Provider,
  ARC001ToARC057Provider,
} from './arc_providers';
import { taskResultsForARC104OnwardsProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

const getContestRound = (contestId: string): number => {
  const roundString = contestId.replace(/^\D+/, '');
  const round = parseInt(roundString, 10);

  if (isNaN(round)) {
    throw new Error(`Invalid contest ID format: ${contestId}`);
  }

  return round;
};

describe('ARC providers', () => {
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
});
