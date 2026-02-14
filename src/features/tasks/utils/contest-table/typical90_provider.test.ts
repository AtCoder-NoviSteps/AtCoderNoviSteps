import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { Typical90Provider } from './typical90_provider';
import { taskResultsForContestTableProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('Typical90Provider', () => {
  const mockTaskResults: TaskResults = taskResultsForContestTableProvider;

  test('expects to filter tasks to include only typical90 contest', () => {
    const provider = new Typical90Provider(ContestType.TYPICAL90);
    const mixedTaskResults = [
      ...mockTaskResults,
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
    ];
    const filtered = provider.filter(mixedTaskResults as TaskResults);

    expect(filtered?.every((task) => task.contest_id === 'typical90')).toBe(true);
    expect(filtered?.length).toBe(6);
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
