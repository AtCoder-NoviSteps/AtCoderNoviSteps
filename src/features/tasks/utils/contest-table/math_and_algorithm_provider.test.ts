import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { MathAndAlgorithmProvider } from './math_and_algorithm_provider';

describe('MathAndAlgorithmProvider', () => {
  test('expects to filter tasks to include only math-and-algorithm contest', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const mixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_a',
        task_table_index: '001',
      },
      { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
      { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
    expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
  });

  test('expects to get correct metadata', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('アルゴリズムと数学');
    expect(metadata.abbreviationName).toBe('math-and-algorithm');
  });

  test('expects to get correct display configuration', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
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
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const label = provider.getContestRoundLabel('math-and-algorithm');

    expect(label).toBe('');
  });

  test('expects to generate correct table structure with mixed problem sources', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const tasks = [
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_a',
        task_table_index: '001',
      },
      { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
      { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
      { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
    ];
    const table = provider.generateTable(tasks as TaskResults);

    expect(table).toHaveProperty('math-and-algorithm');
    expect(table['math-and-algorithm']).toHaveProperty('028');
    expect(table['math-and-algorithm']['028']).toEqual(
      expect.objectContaining({ task_id: 'dp_a' }),
    );
  });

  test('expects to get contest round IDs correctly', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const tasks = [
      { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
      { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
    ];
    const roundIds = provider.getContestRoundIds(tasks as TaskResults);

    expect(roundIds).toEqual(['math-and-algorithm']);
  });

  test('expects to get header IDs for tasks correctly in ascending order', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const tasks = [
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_a',
        task_table_index: '001',
      },
      { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
      { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
      { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['001', '028', '036', '102']);
  });

  test('expects to maintain proper sort order with numeric indices', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const tasks = [
      { contest_id: 'math-and-algorithm', task_id: 'typical90_bz', task_table_index: '045' },
      { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['036', '045']);
  });

  test('expects to handle section boundaries correctly (001-104)', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const tasks = [
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_a',
        task_table_index: '001',
      },
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_bx',
        task_table_index: '104',
      },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['001', '104']);
  });

  test('expects to handle empty task results', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });

  test('expects to handle task results with different contest types', () => {
    const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
    const mixedTasks = [
      {
        contest_id: 'math-and-algorithm',
        task_id: 'math_and_algorithm_a',
        task_table_index: '001',
      },
      { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
      { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: 'A' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered).toHaveLength(2);
    expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
  });
});
