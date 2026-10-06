import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/contests/types/contest';
import type { TaskResults } from '$lib/types/task';

import { Game24Provider } from './game24_provider';

// Task IDs omit the contest number (game_a, not game_24_a), unlike fps-24.
describe('Game24Provider', () => {
  test('expects to get correct metadata', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('組合せゲーム 24 題');
    expect(metadata.abbreviationName).toBe('game-24');
  });

  test('expects to get correct display configuration', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
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
    const provider = new Game24Provider(ContestType.GAME_24);
    const label = provider.getContestRoundLabel('');

    expect(label).toBe('');
  });

  test('expects to filter tasks to include only game-24 contest', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const mixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
      { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_b', task_table_index: 'B' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered?.map((task) => task.task_id)).toEqual(['game_a', 'game_b']);
  });

  test('expects to generate correct table structure', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const tasks = [
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_b', task_table_index: 'B' },
      { contest_id: 'game-24', task_id: 'game_x', task_table_index: 'X' },
    ];
    const table = provider.generateTable(tasks as TaskResults);

    expect(table).toHaveProperty('game-24');
    expect(table['game-24']).toHaveProperty('A');
    expect(table['game-24']).toHaveProperty('B');
    expect(table['game-24']).toHaveProperty('X');
    expect(table['game-24']['A']).toEqual(expect.objectContaining({ task_id: 'game_a' }));
  });

  test('expects to get contest round IDs correctly', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const tasks = [
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_x', task_table_index: 'X' },
    ];
    const roundIds = provider.getContestRoundIds(tasks as TaskResults);

    expect(roundIds).toEqual(['game-24']);
  });

  test('expects to get header IDs for tasks correctly in ascending order', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const tasks = [
      { contest_id: 'game-24', task_id: 'game_a', task_table_index: 'A' },
      { contest_id: 'game-24', task_id: 'game_x', task_table_index: 'X' },
      { contest_id: 'game-24', task_id: 'game_m', task_table_index: 'M' },
      { contest_id: 'game-24', task_id: 'game_b', task_table_index: 'B' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['A', 'B', 'M', 'X']);
  });

  test('expects to handle empty task results', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });

  test('expects to handle task results with different contest types', () => {
    const provider = new Game24Provider(ContestType.GAME_24);
    const mockMixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
      { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
    ];
    const filtered = provider.filter(mockMixedTasks as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
