import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';

import { ABSProvider } from './contest_table_provider';
import { taskResultsForABS } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('ContestTableProviderBase', () => {
  describe('Common provider functionality', () => {
    test('expects to get contest round IDs correctly', () => {
      const provider = new ABSProvider(ContestType.ABS);
      // Use a subset of the mock data that covers the relevant contest IDs
      const filtered = taskResultsForABS.filter((task) => ['abs'].includes(task.contest_id));
      const roundIds = provider.getContestRoundIds(filtered);

      expect(roundIds).toEqual(['abs']);
    });

    test('expects to get header IDs for tasks correctly', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const filtered = taskResultsForABS.filter((task) => task.contest_id === 'abs');
      const headerIds = provider.getHeaderIdsForTask(filtered);

      expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
    });

    test('getTaskLabels returns empty object by default', () => {
      const provider = new ABSProvider(ContestType.ABS);

      expect(provider.getTaskLabels([])).toEqual({});
    });

    test('getTaskLabels returns empty object regardless of input', () => {
      const provider = new ABSProvider(ContestType.ABS);
      const nonEmpty = taskResultsForABS.filter((task) => task.contest_id === 'abs');

      expect(provider.getTaskLabels(nonEmpty)).toEqual({});
    });

    test('columnWrapThreshold is undefined by default (component falls back to 8)', () => {
      const provider = new ABSProvider(ContestType.ABS);

      expect(provider.getDisplayConfig().columnWrapThreshold).toBeUndefined();
    });
  });
});
