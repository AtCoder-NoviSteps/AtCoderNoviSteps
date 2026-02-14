import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { FPS24Provider } from './fps24_provider';

describe('FPS24Provider', () => {
  test('expects to get correct metadata', () => {
    const provider = new FPS24Provider(ContestType.FPS_24);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('FPS 24 題');
    expect(metadata.abbreviationName).toBe('fps-24');
  });

  test('expects to get correct display configuration', () => {
    const provider = new FPS24Provider(ContestType.FPS_24);
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
    const provider = new FPS24Provider(ContestType.FPS_24);
    const label = provider.getContestRoundLabel('');

    expect(label).toBe('');
  });

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
