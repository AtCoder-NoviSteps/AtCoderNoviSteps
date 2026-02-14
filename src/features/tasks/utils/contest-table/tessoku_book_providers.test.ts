import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import {
  TessokuBookProvider,
  TessokuBookForExamplesProvider,
  TessokuBookForPracticalsProvider,
  TessokuBookForChallengesProvider,
} from './tessoku_book_providers';

describe('TessokuBookProvider', () => {
  test('expects to filter tasks to include only tessoku-book contest', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const mixedTasks = [
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered?.every((task) => task.contest_id === 'tessoku-book')).toBe(true);
    expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
  });

  test('expects to get correct metadata', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('競技プログラミングの鉄則');
    expect(metadata.abbreviationName).toBe('tessoku-book');
  });

  test('expects to get correct display configuration', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
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
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const label = provider.getContestRoundLabel('tessoku-book');

    expect(label).toBe('');
  });

  test('expects to generate correct table structure with mixed problem sources', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const tasks = [
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_al', task_table_index: 'B07' },
      { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
    ];
    const table = provider.generateTable(tasks as TaskResults);

    expect(table).toHaveProperty('tessoku-book');
    expect(table['tessoku-book']).toHaveProperty('A06');
    expect(table['tessoku-book']['A06']).toEqual(
      expect.objectContaining({ task_id: 'math_and_algorithm_ai' }),
    );
  });

  test('expects to get contest round IDs correctly', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const tasks = [
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
    ];
    const roundIds = provider.getContestRoundIds(tasks as TaskResults);

    expect(roundIds).toEqual(['tessoku-book']);
  });

  test('expects to get header IDs for tasks correctly in ascending order', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const tasks = [
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_al', task_table_index: 'B07' },
      { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['A01', 'A06', 'A77', 'B07', 'B63', 'C09']);
  });

  test('expects to maintain proper sort order across all sections', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const tasks = [
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ac', task_table_index: 'C09' },
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'tessoku-book', task_id: 'abc007_3', task_table_index: 'B63' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['A06', 'B63', 'C09']);
  });

  test('expects to handle section boundaries correctly (A01-A77, B01-B69, C01-C20)', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const tasks = [
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_bz', task_table_index: 'B01' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_ep', task_table_index: 'B69' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_ey', task_table_index: 'C01' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_fr', task_table_index: 'C20' },
    ];
    const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

    expect(headerIds).toEqual(['A01', 'A77', 'B01', 'B69', 'C01', 'C20']);
  });

  test('expects to handle empty task results', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });

  test('expects to handle task results with different contest types', () => {
    const provider = new TessokuBookProvider(ContestType.TESSOKU_BOOK);
    const mixedTasks = [
      { contest_id: 'tessoku-book', task_id: 'math_and_algorithm_ai', task_table_index: 'A06' },
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
      { contest_id: 'tessoku-book', task_id: 'typical90_a', task_table_index: 'A77' },
      { contest_id: 'typical90', task_id: 'typical90_b', task_table_index: 'B' },
      { contest_id: 'tessoku-book', task_id: 'tessoku_book_a', task_table_index: 'A01' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(filtered).toHaveLength(3);
    expect(filtered?.every((task) => task.contest_id === 'tessoku-book')).toBe(true);
  });
});

describe('TessokuBookForExamplesProvider', () => {
  test('expects to get correct metadata', () => {
    const provider = new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('競技プログラミングの鉄則（A. 例題）');
    expect(metadata.abbreviationName).toBe('tessoku-book-for-examples');
  });
});

describe('TessokuBookForPracticalsProvider', () => {
  test('expects to get correct metadata', () => {
    const provider = new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('競技プログラミングの鉄則（B. 応用問題）');
    expect(metadata.abbreviationName).toBe('tessoku-book-for-practicals');
  });
});

describe('TessokuBookForChallengesProvider', () => {
  test('expects to get correct metadata', () => {
    const provider = new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('競技プログラミングの鉄則（C. 力試し問題）');
    expect(metadata.abbreviationName).toBe('tessoku-book-for-challenges');
  });
});
