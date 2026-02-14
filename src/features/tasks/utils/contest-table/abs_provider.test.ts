import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { ABSProvider } from './abs_provider';
import { taskResultsForABS } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('ABSProvider', () => {
  describe('ABS', () => {
    test('expects to filter tasks with contest_id "abs"', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const filtered = provider.filter(taskResultsForABS);

      expect(filtered).toHaveLength(11);
      expect(filtered.every((task) => task.contest_id === 'abs')).toBe(true);
    });

    test('expects to filter only ABS-type contests', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const mixed = [
        { ...taskResultsForABS[0], contest_id: 'abs' },
        { ...taskResultsForABS[0], contest_id: 'abc378' },
        { ...taskResultsForABS[0], contest_id: 'arc100' },
      ] as TaskResults;

      const filtered = provider.filter(mixed);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].contest_id).toBe('abs');
    });

    test('expects to return correct metadata', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe('AtCoder Beginners Selection');
      expect(metadata.abbreviationName).toBe('abs');
    });

    test('expects to return correct display config with ABS-specific settings', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const config = provider.getDisplayConfig();

      expect(config.isShownHeader).toBe(false);
      expect(config.isShownRoundLabel).toBe(false);
      expect(config.isShownTaskIndex).toBe(false);
      expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2');
      expect(config.roundLabelWidth).toBe('');
    });

    test('expects to return empty string for contest round label', () => {
      const provider = new ABSProvider(ContestType.ABS);

      expect(provider.getContestRoundLabel('abs')).toBe('');
      expect(provider.getContestRoundLabel('abc086')).toBe('');
    });

    test('expects to generate correct table structure with all 11 problems', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const table = provider.generateTable(taskResultsForABS);

      expect(table).toHaveProperty('abs');
      expect(Object.keys(table.abs)).toHaveLength(11);
      expect(Object.keys(table.abs)).toEqual([
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
      ]);
    });

    test('expects to return correct contest round ids', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const roundIds = provider.getContestRoundIds(taskResultsForABS);

      expect(roundIds).toEqual(['abs']);
    });

    test('expects to return correct header ids for all problems', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const headerIds = provider.getHeaderIdsForTask(taskResultsForABS);

      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
    });

    test('expects to verify that ABS problems come from multiple different contests', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const filtered = provider.filter(taskResultsForABS);

      // Extract the original contest_id from task_id
      const sourceContests = new Set(
        filtered.map((task) => {
          if (task.task_id === 'practice_1') {
            return 'practice';
          }

          const match = task.task_id.match(/^(arc|abc)\d+/);
          return match ? match[0] : null;
        }),
      );

      // Derived from 8 different contests from the 10 problems excluding practice_1
      expect(Array.from(sourceContests)).toContain('abc086');
      expect(Array.from(sourceContests)).toContain('abc081');
      expect(Array.from(sourceContests)).toContain('arc089');
      expect(Array.from(sourceContests)).toContain('arc065');
    });

    test('expects to handle empty input gracefully', () => {
      const provider = new ABSProvider(ContestType.ABS);

      const filteredEmpty = provider.filter([] as TaskResults);
      const tableEmpty = provider.generateTable([] as TaskResults);
      const idsEmpty = provider.getContestRoundIds([] as TaskResults);
      const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResults);

      expect(filteredEmpty).toEqual([]);
      expect(tableEmpty).toEqual({});
      expect(idsEmpty).toEqual([]);
      expect(headerIdsEmpty).toEqual([]);
    });
  });
});
