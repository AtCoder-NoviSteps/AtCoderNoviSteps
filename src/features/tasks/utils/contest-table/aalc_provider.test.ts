import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/contests/types/contest';
import type { TaskResults } from '$lib/types/task';

import { AALCProvider } from './aalc_provider';

describe('AALCProvider', () => {
  test('expects to get correct metadata', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe("AAL Contest 001: Let's use segtree!");
    expect(metadata.abbreviationName).toBe('aalc001');
  });

  test('expects to get correct display configuration', () => {
    const provider = new AALCProvider(ContestType.AALC);
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
    const provider = new AALCProvider(ContestType.AALC);
    const label = provider.getContestRoundLabel('');

    expect(label).toBe('');
  });

  test('expects to filter tasks to include only aalc001 contest', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const mixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'aalc001', task_id: 'aalc001_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
      { contest_id: 'aalc001', task_id: 'aalc001_b', task_table_index: 'B' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered?.map((task) => task.task_id)).toEqual(['aalc001_a', 'aalc001_b']);
  });

  test('expects to generate correct table structure', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const tasks = [
      { contest_id: 'aalc001', task_id: 'aalc001_a', task_table_index: 'A' },
      { contest_id: 'aalc001', task_id: 'aalc001_b', task_table_index: 'B' },
      { contest_id: 'aalc001', task_id: 'aalc001_x', task_table_index: 'X' },
    ];
    const table = provider.generateTable(tasks as TaskResults);

    expect(table).toHaveProperty('aalc001');
    expect(table['aalc001']).toHaveProperty('A');
    expect(table['aalc001']).toHaveProperty('B');
    expect(table['aalc001']).toHaveProperty('X');
    expect(table['aalc001']['A']).toEqual(expect.objectContaining({ task_id: 'aalc001_a' }));
  });

  test('expects to get contest round IDs correctly', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const tasks = [
      { contest_id: 'aalc001', task_id: 'aalc001_a', task_table_index: 'A' },
      { contest_id: 'aalc001', task_id: 'aalc001_x', task_table_index: 'X' },
    ];
    const roundIds = provider.getContestRoundIds(tasks as TaskResults);

    expect(roundIds).toEqual(['aalc001']);
  });

  test('expects to get header IDs for tasks correctly in ascending order', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const tasks = [
      { contest_id: 'aalc001', task_id: 'aalc001_a', task_table_index: 'A' },
      { contest_id: 'aalc001', task_id: 'aalc001_x', task_table_index: 'X' },
      { contest_id: 'aalc001', task_id: 'aalc001_m', task_table_index: 'M' },
      { contest_id: 'aalc001', task_id: 'aalc001_b', task_table_index: 'B' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['A', 'B', 'M', 'X']);
  });

  test('expects to handle empty task results', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });

  test('expects to handle task results with different contest types', () => {
    const provider = new AALCProvider(ContestType.AALC);
    const mockMixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
    ];
    const filtered = provider.filter(mockMixedTasks as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
