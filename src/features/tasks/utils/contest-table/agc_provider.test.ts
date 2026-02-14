import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { AGC001OnwardsProvider } from './agc_provider';
import { parseContestRound } from './contest_table_provider_base';
import { taskResultsForAGC001OnwardsProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('AGC001OnwardsProvider', () => {
  test('expects to filter tasks to include only AGC001 and later', () => {
    const provider = new AGC001OnwardsProvider(ContestType.AGC);
    const filtered = provider.filter(taskResultsForAGC001OnwardsProvider);

    expect(filtered.every((task) => task.contest_id.startsWith('agc'))).toBe(true);
    expect(
      filtered.every((task) => {
        const round = parseContestRound(task.contest_id, 'agc');
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

    ['agc009', 'agc074'].forEach((contestId) => {
      const agcTasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === contestId,
      );
      const headerIds = provider.getHeaderIdsForTask(agcTasks as TaskResults);

      expect(agcTasks).toHaveLength(5);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  test('expects to handle 6-problem contest pattern (AGC001, AGC002)', () => {
    const provider = new AGC001OnwardsProvider(ContestType.AGC);

    ['agc001', 'agc002'].forEach((contestId) => {
      const agc001Tasks = taskResultsForAGC001OnwardsProvider.filter(
        (task) => task.contest_id === contestId,
      );
      const headerIds = provider.getHeaderIdsForTask(agc001Tasks as TaskResults);

      expect(agc001Tasks).toHaveLength(6);
      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });
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
        const round = parseContestRound(task.contest_id, 'agc');
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
