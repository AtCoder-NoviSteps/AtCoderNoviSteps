import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { AWC0001OnwardsProvider } from './awc_provider';
import { taskResultsForAWC0001OnwardsProvider } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('AWC0001OnwardsProvider', () => {
  test('expects to filter tasks to include only AWC contests', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001OnwardsProvider);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((task) => task.contest_id.startsWith('awc'))).toBe(true);
    expect(filtered.every((task) => /^awc\d{4}$/.test(task.contest_id))).toBe(true);
  });

  test('expects to filter by range (awc0001 to awc9999)', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001OnwardsProvider);

    expect(filtered.some((task) => task.contest_id === 'awc0001')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0002')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0099')).toBe(true);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0001 〜 ');
    expect(metadata.abbreviationName).toBe('awc0001Onwards');
  });

  test('expects to return correct display config', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(true);
    expect(config.isShownRoundLabel).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1');
    expect(config.roundLabelWidth).toBe('xl:w-16');
    expect(config.isShownTaskIndex).toBe(false);
  });

  test('expects to format contest round label correctly', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0001')).toBe('0001');
    expect(provider.getContestRoundLabel('awc0002')).toBe('0002');
    expect(provider.getContestRoundLabel('awc0099')).toBe('0099');
  });

  test('expects to generate table for multiple AWC contests', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001OnwardsProvider);
    const table = provider.generateTable(filtered);

    expect(Object.keys(table).length).toBeGreaterThan(0);
    expect(table).toHaveProperty('awc0001');
    expect(table).toHaveProperty('awc0002');
    expect(table).toHaveProperty('awc0099');
  });

  test('expects each AWC contest to have 5 problems (A-E)', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001OnwardsProvider);
    const table = provider.generateTable(filtered);

    Object.entries(table).forEach(([contestId, problems]) => {
      const problemCount = Object.keys(problems).length;
      expect(problemCount).toBe(5);
      expect(Object.keys(problems)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0001OnwardsProvider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
