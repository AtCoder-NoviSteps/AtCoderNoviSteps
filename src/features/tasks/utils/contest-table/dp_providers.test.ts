import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { EDPCProvider, TDPCProvider } from './dp_providers';

describe('DP providers', () => {
  describe.each([
    {
      providerClass: EDPCProvider,
      contestType: ContestType.EDPC,
      contestId: 'dp',
      title: 'Educational DP Contest / DP まとめコンテスト',
      abbreviationName: 'edpc',
      label: 'EDPC provider',
    },
    {
      providerClass: TDPCProvider,
      contestType: ContestType.TDPC,
      contestId: 'tdpc',
      title: 'Typical DP Contest',
      abbreviationName: 'tdpc',
      label: 'TDPC provider',
    },
  ])('$label', ({ providerClass, contestType, contestId, title, abbreviationName }) => {
    test('expects to get correct metadata', () => {
      const provider = new providerClass(contestType);
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.abbreviationName).toBe(abbreviationName);
    });

    test('expects to get correct display configuration', () => {
      const provider = new providerClass(contestType);
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
      const provider = new providerClass(contestType);
      const label = provider.getContestRoundLabel('');

      expect(label).toBe('');
    });

    test('expects to filter tasks to include only matching contest', () => {
      const provider = new providerClass(contestType);
      const mixedTasks = [
        { contest_id: contestId, task_id: `${contestId}_a`, task_table_index: 'A' },
        { contest_id: contestId, task_id: `${contestId}_b`, task_table_index: 'B' },
        { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
        { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
      ];
      const filtered = provider.filter(mixedTasks as TaskResults);

      expect(filtered?.every((task) => task.contest_id === contestId)).toBe(true);
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
      expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
    });

    test('expects to handle empty task results', () => {
      const provider = new providerClass(contestType);
      const filtered = provider.filter([] as TaskResults);

      expect(filtered).toEqual([] as TaskResults);
    });

    test('expects to generate correct table structure', () => {
      const provider = new providerClass(contestType);
      const tasks = [
        { contest_id: contestId, task_id: `${contestId}_a`, task_table_index: 'A' },
        { contest_id: contestId, task_id: `${contestId}_b`, task_table_index: 'B' },
      ];
      const table = provider.generateTable(tasks as TaskResults);

      expect(table).toHaveProperty(contestId);
      expect(table[contestId]).toHaveProperty('A');
      expect(table[contestId]).toHaveProperty('B');
    });

    test('expects to get contest round IDs correctly', () => {
      const provider = new providerClass(contestType);
      const tasks = [{ contest_id: contestId, task_id: `${contestId}_a`, task_table_index: 'A' }];
      const roundIds = provider.getContestRoundIds(tasks as TaskResults);

      expect(roundIds).toEqual([contestId]);
    });
  });
});
