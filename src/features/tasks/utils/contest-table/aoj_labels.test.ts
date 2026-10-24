import { describe, test, expect } from 'vitest';

import type { TaskResults } from '#lib/types/task.js';

import { buildAojDisplayConfig, sortAojHeaderIds } from './aoj_labels';

describe('sortAojHeaderIds', () => {
  test('returns unique task_table_index values in ascending letter order', () => {
    const filtered = [
      { task_table_index: 'C' },
      { task_table_index: 'A' },
      { task_table_index: 'B' },
    ] as TaskResults;

    expect(sortAojHeaderIds(filtered)).toEqual(['A', 'B', 'C']);
  });

  test('sorts letters A through L for the 12 problems of ICPC Regional 2024', () => {
    const filtered = ['L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'].map((letter) => ({
      task_table_index: letter,
    })) as TaskResults;

    expect(sortAojHeaderIds(filtered)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
    ]);
  });

  test('deduplicates repeated task_table_index values', () => {
    const filtered = [{ task_table_index: 'A' }, { task_table_index: 'A' }] as TaskResults;

    expect(sortAojHeaderIds(filtered)).toEqual(['A']);
  });

  test('returns empty array for empty input', () => {
    expect(sortAojHeaderIds([] as TaskResults)).toEqual([]);
  });
});

describe('buildAojDisplayConfig', () => {
  test('returns the shared AOJ display config', () => {
    const config = buildAojDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.isShownTaskIndex).toBe(true);
    expect(config.roundLabelWidth).toBe('');
    expect(config.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2');
    expect(config.columnWrapThreshold).toBe(6);
  });
});
