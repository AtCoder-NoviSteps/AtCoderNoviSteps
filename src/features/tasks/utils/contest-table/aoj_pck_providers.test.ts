import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResults } from '#lib/types/task.js';

import { AojPckProvider } from './aoj_pck_providers';

const tasks: TaskResults = [
  {
    contest_id: 'PCKPrelim2026',
    task_id: '4095',
    task_table_index: '12',
    title: "Kobou's Vocabulary Book",
  },
  {
    contest_id: 'PCKPrelim2026',
    task_id: '4085',
    task_table_index: '2',
    title: 'Bonus Points Month',
  },
  { contest_id: 'PCKPrelim2026', task_id: '4084', task_table_index: '1', title: '2026' },
  {
    contest_id: 'PCKPrelim2025',
    task_id: '4060',
    task_table_index: '1',
    title: 'Server Load Prediction',
  },
  { contest_id: 'PCKFinal2025', task_id: '4071', task_table_index: '1', title: 'Integer Part' },
  { contest_id: 'PCKFinal2003', task_id: '0000', task_table_index: '1', title: 'QQ' },
  { contest_id: 'JAGPrelim2026', task_id: '3452', task_table_index: 'A', title: 'Booby Prize' },
] as TaskResults;

describe('AojPckProvider', () => {
  test('filters only the selected PCK year and round', () => {
    const provider = new AojPckProvider(ContestType.AOJ_PCK, 2026, 'Prelim');
    const filtered = provider.filter(tasks);

    expect(filtered.map((task) => task.task_id)).toEqual(['4095', '4085', '4084']);
    expect(provider.getHeaderIdsForTask(filtered)).toEqual(['1', '2', '12']);
  });

  test('uses distinct keys for preliminary and final contests in the same year', () => {
    const prelim = new AojPckProvider(ContestType.AOJ_PCK, 2025, 'Prelim');
    const final = new AojPckProvider(ContestType.AOJ_PCK, 2025, 'Final');

    expect(prelim.getProviderKey()).toBe('AOJ_PCK::Prelim2025');
    expect(final.getProviderKey()).toBe('AOJ_PCK::Final2025');
    expect(final.filter(tasks).map((task) => task.task_id)).toEqual(['4071']);
  });

  test.each([
    [2026, 'Prelim', 'PCK 2026 予選', 'PCKPrelim2026', 'pckPrelim2026'],
    [2025, 'Final', 'PCK 2025 本選', 'PCKFinal2025', 'pckFinal2025'],
    [2003, 'Final', 'PCK 2003 本選', 'PCKFinal2003', 'pckFinal2003'],
  ] as const)('labels the %i %s table', (year, round, title, contestId, abbreviationName) => {
    const provider = new AojPckProvider(ContestType.AOJ_PCK, year, round);

    expect(provider.getMetadata()).toEqual({
      title,
      abbreviationName,
      titleStyle: {
        headingTag: 'h2',
        fontSize: 'text-xl',
        fontWeight: 'font-bold',
        bottomGap: 'pb-1',
      },
    });
    expect(provider.getContestRoundLabel(contestId)).toBe(title);
  });

  test('uses the per-contest layout without modifying task titles', () => {
    const provider = new AojPckProvider(ContestType.AOJ_PCK, 2026, 'Prelim');
    const filtered = provider.filter(tasks);
    const before = structuredClone(filtered);

    expect(provider.getDisplayConfig()).toEqual({
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
      isShownTaskIndex: true,
      columnWrapThreshold: 6,
    });
    expect(provider.generateTable(filtered).PCKPrelim2026['1'].title).toBe('2026');
    provider.generateTable(filtered);
    expect(filtered).toEqual(before);
  });

  test('returns an empty table when the selected contest has no tasks', () => {
    const provider = new AojPckProvider(ContestType.AOJ_PCK, 2024, 'Final');

    expect(provider.filter(tasks)).toEqual([]);
    expect(provider.getHeaderIdsForTask([])).toEqual([]);
    expect(provider.generateTable([])).toEqual({});
  });
});
