import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import {
  AWC0001To0099Provider,
  AWC0100Provider,
  AWC0101To0149Provider,
  AWC0150Provider,
} from './awc_provider';
import {
  taskResultsForAWC0001To0099Provider,
  taskResultsForAWC0100Provider,
  taskResultsForAWC0101To0149Provider,
  taskResultsForAWC0150Provider,
} from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('AWC0150Provider', () => {
  test('expects to filter only awc0150 tasks', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0101To0149Provider, ...taskResultsForAWC0150Provider];
    const filtered = provider.filter(combined);

    expect(filtered.length).toBe(15);
    expect(filtered.every((task) => task.contest_id === 'awc0150')).toBe(true);
  });

  test('expects to exclude awc0101 and awc0149', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0101To0149Provider, ...taskResultsForAWC0150Provider];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0101')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0149')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0150');
    expect(metadata.abbreviationName).toBe('awc0150');
  });

  test('expects to return correct display config (EDPC format)', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.roundLabelWidth).toBe('');
    expect(config.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
    );
    expect(config.isShownTaskIndex).toBe(true);
  });

  test('expects getContestRoundLabel to return empty string', () => {
    const provider = new AWC0150Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0150')).toBe('');
  });

  test('expects generateTable to produce 15 tasks (A-O) for awc0150', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0150Provider);
    const table = provider.generateTable(filtered);

    expect(table).toHaveProperty('awc0150');
    const problems = table['awc0150'];
    expect(Object.keys(problems)).toHaveLength(15);
    expect(Object.keys(problems)).toEqual([
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
      'M',
      'N',
      'O',
    ]);
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});

describe('AWC0101To0149Provider', () => {
  test('expects to filter tasks to include only AWC 0101-0149 contests', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((task) => task.contest_id.startsWith('awc'))).toBe(true);
  });

  test('expects to filter by range (awc0101 to awc0149)', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const combined = [
      ...taskResultsForAWC0001To0099Provider,
      ...taskResultsForAWC0100Provider,
      ...taskResultsForAWC0101To0149Provider,
      ...taskResultsForAWC0150Provider,
    ];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0101')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0102')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0149')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0099')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0100')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0150')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0101 〜 0149');
    expect(metadata.abbreviationName).toBe('awc0101To0149');
  });

  test('expects to return correct display config', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(true);
    expect(config.isShownRoundLabel).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1');
    expect(config.roundLabelWidth).toBe('xl:w-16');
    expect(config.isShownTaskIndex).toBe(false);
  });

  test('expects to format contest round label correctly', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0101')).toBe('0101');
    expect(provider.getContestRoundLabel('awc0149')).toBe('0149');
  });

  test('expects to generate table for multiple AWC contests', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);
    const table = provider.generateTable(filtered);

    expect(Object.keys(table).length).toBeGreaterThan(0);
    expect(table).toHaveProperty('awc0101');
    expect(table).toHaveProperty('awc0102');
    expect(table).toHaveProperty('awc0149');
  });

  test('expects each AWC contest to have 5 problems (A-E)', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);
    const table = provider.generateTable(filtered);

    Object.entries(table).forEach(([_contestId, problems]) => {
      const problemCount = Object.keys(problems).length;
      expect(problemCount).toBe(5);
      expect(Object.keys(problems)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});

describe('AWC0100Provider', () => {
  test('expects to filter only awc0100 tasks', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0001To0099Provider, ...taskResultsForAWC0100Provider];
    const filtered = provider.filter(combined);

    expect(filtered.length).toBe(15);
    expect(filtered.every((task) => task.contest_id === 'awc0100')).toBe(true);
  });

  test('expects to exclude awc0001 and awc0099', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0001To0099Provider, ...taskResultsForAWC0100Provider];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0001')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0099')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0100');
    expect(metadata.abbreviationName).toBe('awc0100');
  });

  test('expects to return correct display config (EDPC format)', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.roundLabelWidth).toBe('');
    expect(config.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
    );
    expect(config.isShownTaskIndex).toBe(true);
  });

  test('expects getContestRoundLabel to return empty string', () => {
    const provider = new AWC0100Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0100')).toBe('');
  });

  test('expects generateTable to produce 15 tasks (A-O) for awc0100', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0100Provider);
    const table = provider.generateTable(filtered);

    expect(table).toHaveProperty('awc0100');
    const problems = table['awc0100'];
    expect(Object.keys(problems)).toHaveLength(15);
    expect(Object.keys(problems)).toEqual([
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
      'M',
      'N',
      'O',
    ]);
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0100Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});

describe('AWC0001To0099Provider', () => {
  test('expects to filter tasks to include only AWC contests', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001To0099Provider);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((task) => task.contest_id.startsWith('awc'))).toBe(true);
    expect(filtered.every((task) => /^awc\d{4}$/.test(task.contest_id))).toBe(true);
  });

  test('expects to filter by range (awc0001 to awc0099)', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0001To0099Provider, ...taskResultsForAWC0100Provider];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0001')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0002')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0099')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0100')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0001 〜 0099');
    expect(metadata.abbreviationName).toBe('awc0001To0099');
  });

  test('expects to return correct display config', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(true);
    expect(config.isShownRoundLabel).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1');
    expect(config.roundLabelWidth).toBe('xl:w-16');
    expect(config.isShownTaskIndex).toBe(false);
  });

  test('expects to format contest round label correctly', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0001')).toBe('0001');
    expect(provider.getContestRoundLabel('awc0002')).toBe('0002');
    expect(provider.getContestRoundLabel('awc0099')).toBe('0099');
  });

  test('expects to generate table for multiple AWC contests', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001To0099Provider);
    const table = provider.generateTable(filtered);

    expect(Object.keys(table).length).toBeGreaterThan(0);
    expect(table).toHaveProperty('awc0001');
    expect(table).toHaveProperty('awc0002');
    expect(table).toHaveProperty('awc0099');
  });

  test('expects each AWC contest to have 5 problems (A-E)', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0001To0099Provider);
    const table = provider.generateTable(filtered);

    Object.entries(table).forEach(([_contestId, problems]) => {
      const problemCount = Object.keys(problems).length;
      expect(problemCount).toBe(5);
      expect(Object.keys(problems)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0001To0099Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
