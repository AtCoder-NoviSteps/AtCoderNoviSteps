import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { ABCLikeProvider } from './axc_like_provider';
import { taskResultsForABCLikeProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('ABCLikeProvider', () => {
  test('expects to filter tasks to include only ABC-Like contests', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForABCLikeProvider);

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((task) => {
        const contestId = task.contest_id;

        return [
          'tenka1-2017-beginner',
          'tenka1-2018-beginner',
          'tenka1-2019-beginner',
          'abl',
          'caddi2018b',
          'soundhound2018-summer-qual',
          'aising2019',
          'aising2020',
          'sumitrust2019',
          'hhkb2020',
          'm-solutions2020',
          'panasonic2020',
          'jsc2021',
          'zone2021',
          'jsc2025advance-final',
        ].includes(contestId);
      }),
    ).toBe(true);
  });

  test('expects to get correct metadata', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('ABC-Like Contest');
    expect(metadata.abbreviationName).toBe('abcLike');
  });

  test('expects to get correct display configuration', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const displayConfig = provider.getDisplayConfig();

    expect(displayConfig.roundLabelWidth).toBe('xl:w-28');
    expect(displayConfig.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    );
  });

  test('expects to format contest ID as round label', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const label = provider.getContestRoundLabel('jsc2021');

    expect(label).toBe('JSC2021');
  });

  test('expects to generate table with multiple contests', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForABCLikeProvider);
    const table = provider.generateTable(filtered);

    expect(Object.keys(table).length).toBeGreaterThan(0);
    expect(table).toHaveProperty('jsc2021');
    expect(table).toHaveProperty('jsc2025advance-final');
  });

  test('expects to handle shared task references (jsc2025advance-final → ABC422)', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForABCLikeProvider);

    const jsc2025Tasks = filtered.filter((task) => task.contest_id === 'jsc2025advance-final');
    expect(jsc2025Tasks.length).toBeGreaterThan(0);
    expect(jsc2025Tasks.some((task) => task.task_id === 'abc422_a')).toBe(true);
    expect(jsc2025Tasks.some((task) => task.task_id === 'abc422_h')).toBe(true);
  });

  test('expects to handle shared problem patterns (tenka1-201x-beginner → tenka1-201x)', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForABCLikeProvider);

    const tenka2017Beginner = filtered.filter((task) => task.contest_id === 'tenka1-2017-beginner');
    const tenka2017 = filtered.filter((task) => task.contest_id === 'tenka1-2017');

    expect(tenka2017Beginner.length).toBeGreaterThan(0);
    expect(tenka2017.length).toBe(0);

    // Check that both have A,B (from beginner) and C (shared from tenka1)
    expect(tenka2017Beginner.some((task) => task.task_table_index === 'A')).toBe(true);
    expect(tenka2017Beginner.some((task) => task.task_table_index === 'B')).toBe(true);
    expect(tenka2017Beginner.some((task) => task.task_table_index === 'C')).toBe(true);
    expect(tenka2017.some((task) => task.task_table_index === 'C')).toBe(false);
  });

  test('expects to handle contests with different problem ranges (A-F, A-H)', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter(taskResultsForABCLikeProvider);

    const zone2021Tasks = filtered.filter((task) => task.contest_id === 'zone2021');
    const jsc2021Tasks = filtered.filter((task) => task.contest_id === 'jsc2021');

    // Zone2021: A-F
    expect(zone2021Tasks.some((task) => task.task_table_index === 'F')).toBe(true);
    // JSC2021: A-H
    expect(jsc2021Tasks.some((task) => task.task_table_index === 'H')).toBe(true);
  });

  test('expects to filter out non-ABC-Like contests', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const mixedTasks = [
      ...taskResultsForABCLikeProvider,
      { contest_id: 'abc212', task_id: 'abc212_a', task_table_index: 'A' },
      { contest_id: 'arc100', task_id: 'arc100_a', task_table_index: 'A' },
      { contest_id: 'agc001', task_id: 'agc001_a', task_table_index: 'A' },
    ];
    const filtered = provider.filter(mixedTasks as TaskResults);

    expect(
      filtered.every((task) =>
        [
          'tenka1-2017-beginner',
          'tenka1-2018-beginner',
          'tenka1-2019-beginner',
          'abl',
          'caddi2018b',
          'soundhound2018-summer-qual',
          'aising2019',
          'aising2020',
          'sumitrust2019',
          'hhkb2020',
          'm-solutions2020',
          'panasonic2020',
          'jsc2021',
          'zone2021',
          'jsc2025advance-final',
        ].includes(task.contest_id),
      ),
    ).toBe(true);
    expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc212' }));
    expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'arc100' }));
    expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'agc001' }));
  });

  test('expects to handle empty task results', () => {
    const provider = new ABCLikeProvider(ContestType.ABC_LIKE);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
