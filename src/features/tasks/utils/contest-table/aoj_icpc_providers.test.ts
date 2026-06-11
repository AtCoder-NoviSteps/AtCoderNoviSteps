import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { ICPC_PRELIM_LABEL_OVERRIDES } from './aoj_icpc_labels';
import { AojIcpcPrelimProvider } from './aoj_icpc_providers';

const createProvider = (year: number) => new AojIcpcPrelimProvider(ContestType.AOJ_ICPC, year);

// ICPCPrelim1998: 4 problems (A–D), oldest year on AOJ
const tasks1998: TaskResults = [
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1100',
    task_table_index: '1100',
    title: 'Area of Polygons',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1101',
    task_table_index: '1101',
    title: 'A Simple Offline Text Editor',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1102',
    task_table_index: '1102',
    title: 'Calculation of Expressions',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1103',
    task_table_index: '1103',
    title: 'Board Arrangements for Concentration Games',
  },
] as TaskResults;

// ICPCPrelim2023: 8 problems (A–H), used as the primary fixture
const tasks2023: TaskResults = [
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1664',
    task_table_index: '1664',
    title: 'Which Team Should Receive the Sponsor Prize?',
  },
  { contest_id: 'ICPCPrelim2023', task_id: '1665', task_table_index: '1665', title: 'Amidakuji' },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1666',
    task_table_index: '1666',
    title: 'Changing the Sitting Arrangement',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1667',
    task_table_index: '1667',
    title: 'Efficient Problem Set',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1668',
    task_table_index: '1668',
    title: 'Tampered Records',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1669',
    task_table_index: '1669',
    title: 'Villa of Emblem Shape',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1670',
    task_table_index: '1670',
    title: 'Fair Deal of Dice',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1671',
    task_table_index: '1671',
    title: 'Planning Locations of Bus Stops',
  },
] as TaskResults;

// ICPCPrelim2025: 9 problems (A–I), latest year and maximum problem count
const tasks2025: TaskResults = [
  { contest_id: 'ICPCPrelim2025', task_id: '1681', task_table_index: '1681', title: '2025' },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1682',
    task_table_index: '1682',
    title: 'Prefix and Suffix Can Be the Same',
  },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1683',
    task_table_index: '1683',
    title: 'Calendar of an Enthusiastic Worker',
  },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1684',
    task_table_index: '1684',
    title: 'Ancient Game Board',
  },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1685',
    task_table_index: '1685',
    title: 'To Be Discontinued',
  },
  { contest_id: 'ICPCPrelim2025', task_id: '1686', task_table_index: '1686', title: 'Dog Tricks' },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1687',
    task_table_index: '1687',
    title: 'Number of Faces',
  },
  { contest_id: 'ICPCPrelim2025', task_id: '1688', task_table_index: '1688', title: 'Parentheses' },
  {
    contest_id: 'ICPCPrelim2025',
    task_id: '1689',
    task_table_index: '1689',
    title: 'Preparing the Lunch',
  },
] as TaskResults;

const mixedTasks: TaskResults = [
  ...tasks2023,
  // ICPCPrelim2022: one problem to verify year filtering
  {
    contest_id: 'ICPCPrelim2022',
    task_id: '1656',
    task_table_index: '1656',
    title: 'Counting Peaks of Infection',
  },
  // Non-ICPC contest, to verify contest-type filtering
  { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A', title: 'Divisor' },
] as TaskResults;

describe('AojIcpcPrelimProvider', () => {
  // Shared immutable instance for the primary test year — no beforeEach needed
  const provider2023 = createProvider(2023);

  describe('filter', () => {
    describe('successful cases', () => {
      test('returns only tasks belonging to the given year contest', () => {
        const filtered = provider2023.filter(mixedTasks);

        expect(filtered).toHaveLength(8);
        expect(filtered.every((task) => task.contest_id === 'ICPCPrelim2023')).toBe(true);
      });

      test('excludes tasks from other ICPC years', () => {
        const filtered = provider2023.filter(mixedTasks);

        expect(filtered.some((task) => task.contest_id === 'ICPCPrelim2022')).toBe(false);
      });

      test('excludes tasks from non-ICPC contests', () => {
        const filtered = provider2023.filter(mixedTasks);

        expect(filtered.some((task) => task.contest_id === 'abc123')).toBe(false);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider2023.filter([] as TaskResults)).toEqual([]);
      });

      test('returns empty array when no tasks match the given year', () => {
        const provider2024 = createProvider(2024);

        expect(provider2024.filter(tasks2023)).toEqual([]);
      });
    });
  });

  describe('generateTable', () => {
    describe('successful cases', () => {
      test('stores raw titles (no letter prefix) for all 8 tasks', () => {
        const table = provider2023.generateTable(tasks2023);

        expect(table['ICPCPrelim2023']['1664'].title).toBe(
          'Which Team Should Receive the Sponsor Prize?',
        );
        expect(table['ICPCPrelim2023']['1665'].title).toBe('Amidakuji');
        expect(table['ICPCPrelim2023']['1666'].title).toBe('Changing the Sitting Arrangement');
        expect(table['ICPCPrelim2023']['1667'].title).toBe('Efficient Problem Set');
        expect(table['ICPCPrelim2023']['1668'].title).toBe('Tampered Records');
        expect(table['ICPCPrelim2023']['1669'].title).toBe('Villa of Emblem Shape');
        expect(table['ICPCPrelim2023']['1670'].title).toBe('Fair Deal of Dice');
        expect(table['ICPCPrelim2023']['1671'].title).toBe('Planning Locations of Bus Stops');
      });

      test('title is unchanged when generateTable is called twice (structurally idempotent)', () => {
        const firstTable = provider2023.generateTable(tasks2023);
        const secondInput = Object.values(firstTable['ICPCPrelim2023']) as TaskResults;
        const secondTable = provider2023.generateTable(secondInput);

        expect(secondTable['ICPCPrelim2023']['1665'].title).toBe('Amidakuji');
      });

      test('uses task_table_index as the inner key', () => {
        const table = provider2023.generateTable(tasks2023);

        expect(Object.keys(table['ICPCPrelim2023'])).toEqual(
          expect.arrayContaining(['1664', '1665', '1666', '1667', '1668', '1669', '1670', '1671']),
        );
      });

      test('creates table keyed by contest_id', () => {
        const table = provider2023.generateTable(tasks2023);

        expect(Object.keys(table)).toEqual(['ICPCPrelim2023']);
      });

      test('does not mutate original task data', () => {
        const originalTitle = tasks2023[0].title;
        provider2023.generateTable(tasks2023);

        expect(tasks2023[0].title).toBe(originalTitle);
      });
    });
  });

  describe('getMetadata', () => {
    test('returns correct title with year', () => {
      expect(provider2023.getMetadata().title).toBe('ICPC 国内予選 2023');
    });

    test('returns correct abbreviationName with year', () => {
      expect(provider2023.getMetadata().abbreviationName).toBe('icpcPrelim2023');
    });

    test('returns titleStyle with text-base font size, pb-1 bottom gap, and h3 heading tag', () => {
      expect(provider2023.getMetadata().titleStyle).toEqual({
        headingTag: 'h3',
        fontSize: 'text-base',
        fontWeight: 'font-normal',
        bottomGap: 'pb-1',
      });
    });
  });

  describe('getDisplayConfig', () => {
    test('returns isShownHeader as false', () => {
      expect(provider2023.getDisplayConfig().isShownHeader).toBe(false);
    });

    test('returns isShownRoundLabel as false', () => {
      expect(provider2023.getDisplayConfig().isShownRoundLabel).toBe(false);
    });

    test('returns isShownTaskIndex as true', () => {
      expect(provider2023.getDisplayConfig().isShownTaskIndex).toBe(true);
    });

    test('returns empty roundLabelWidth', () => {
      expect(provider2023.getDisplayConfig().roundLabelWidth).toBe('');
    });

    test('returns correct tableBodyCellsWidth', () => {
      expect(provider2023.getDisplayConfig().tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
      );
    });
  });

  describe('getContestRoundLabel', () => {
    test('returns label with year', () => {
      expect(provider2023.getContestRoundLabel('ICPCPrelim2023')).toBe('ICPC 国内予選 2023');
    });
  });

  describe('getContestRoundIds', () => {
    test('returns contest_id of the filtered tasks', () => {
      expect(provider2023.getContestRoundIds(tasks2023)).toEqual(['ICPCPrelim2023']);
    });

    test('returns empty array for empty input', () => {
      expect(provider2023.getContestRoundIds([] as TaskResults)).toEqual([]);
    });
  });

  describe('getHeaderIdsForTask', () => {
    describe('successful cases', () => {
      test('returns indices sorted numerically ascending regardless of input order', () => {
        const reversedTasks = [...tasks2023].reverse() as TaskResults;

        expect(provider2023.getHeaderIdsForTask(reversedTasks)).toEqual([
          '1664',
          '1665',
          '1666',
          '1667',
          '1668',
          '1669',
          '1670',
          '1671',
        ]);
      });

      test('deduplicates repeated task_table_index values', () => {
        const duplicateTasks = [tasks2023[0], tasks2023[0]] as TaskResults;

        expect(provider2023.getHeaderIdsForTask(duplicateTasks)).toEqual(['1664']);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider2023.getHeaderIdsForTask([] as TaskResults)).toEqual([]);
      });
    });
  });

  describe('year boundary behavior', () => {
    const provider1998 = createProvider(1998);
    const provider2025 = createProvider(2025);

    test('oldest year 1998 returns correct metadata (4 problems, A–D)', () => {
      expect(provider1998.getMetadata().title).toBe('ICPC 国内予選 1998');
      expect(provider1998.getMetadata().abbreviationName).toBe('icpcPrelim1998');
    });

    test('oldest year 1998 stores raw titles for 4 tasks', () => {
      const table = provider1998.generateTable(tasks1998);

      expect(table['ICPCPrelim1998']['1100'].title).toBe('Area of Polygons');
      expect(table['ICPCPrelim1998']['1101'].title).toBe('A Simple Offline Text Editor');
      expect(table['ICPCPrelim1998']['1102'].title).toBe('Calculation of Expressions');
      expect(table['ICPCPrelim1998']['1103'].title).toBe(
        'Board Arrangements for Concentration Games',
      );
    });

    test('oldest year 1998 filter isolates its own contest_id', () => {
      const mixed = [...tasks1998, ...tasks2023] as TaskResults;
      const filtered = provider1998.filter(mixed);

      expect(filtered).toHaveLength(4);
      expect(filtered.every((task) => task.contest_id === 'ICPCPrelim1998')).toBe(true);
    });

    test('latest year 2025 returns correct metadata (9 problems, A–I)', () => {
      expect(provider2025.getMetadata().title).toBe('ICPC 国内予選 2025');
      expect(provider2025.getMetadata().abbreviationName).toBe('icpcPrelim2025');
    });

    test('latest year 2025 stores raw titles (maximum problem count)', () => {
      const table = provider2025.generateTable(tasks2025);

      expect(table['ICPCPrelim2025']['1681'].title).toBe('2025');
      expect(table['ICPCPrelim2025']['1689'].title).toBe('Preparing the Lunch');
    });

    test('latest year 2025 filter isolates its own contest_id', () => {
      const mixed = [...tasks2025, ...tasks2023] as TaskResults;
      const filtered = provider2025.filter(mixed);

      expect(filtered).toHaveLength(9);
      expect(filtered.every((task) => task.contest_id === 'ICPCPrelim2025')).toBe(true);
    });
  });

  describe('override map path', () => {
    const TEST_YEAR = 9999;
    const TEST_CONTEST_ID = `ICPCPrelim${TEST_YEAR}`;

    const overrideTasks: TaskResults = [
      { contest_id: TEST_CONTEST_ID, task_id: '9001', task_table_index: '9001', title: 'Task One' },
      { contest_id: TEST_CONTEST_ID, task_id: '9002', task_table_index: '9002', title: 'Task Two' },
    ] as TaskResults;

    beforeEach(() => {
      ICPC_PRELIM_LABEL_OVERRIDES[TEST_CONTEST_ID] = {
        '9001': 'X',
        '9002': 'Y',
      };
    });

    afterEach(() => {
      delete ICPC_PRELIM_LABEL_OVERRIDES[TEST_CONTEST_ID];
    });

    test('generateTable stores raw titles even when override map is active', () => {
      const provider = createProvider(TEST_YEAR);
      const table = provider.generateTable(overrideTasks);

      expect(table[TEST_CONTEST_ID]['9001'].title).toBe('Task One');
      expect(table[TEST_CONTEST_ID]['9002'].title).toBe('Task Two');
    });
  });

  describe('getTaskLabels', () => {
    describe('successful cases', () => {
      test('returns letter map for all 8 tasks in numeric ID order (A–H)', () => {
        const labels = provider2023.getTaskLabels(tasks2023);

        expect(labels['ICPCPrelim2023']['1664']).toBe('A');
        expect(labels['ICPCPrelim2023']['1665']).toBe('B');
        expect(labels['ICPCPrelim2023']['1666']).toBe('C');
        expect(labels['ICPCPrelim2023']['1667']).toBe('D');
        expect(labels['ICPCPrelim2023']['1668']).toBe('E');
        expect(labels['ICPCPrelim2023']['1669']).toBe('F');
        expect(labels['ICPCPrelim2023']['1670']).toBe('G');
        expect(labels['ICPCPrelim2023']['1671']).toBe('H');
      });

      test('returns object keyed by contestId', () => {
        const labels = provider2023.getTaskLabels(tasks2023);

        expect(Object.keys(labels)).toEqual(['ICPCPrelim2023']);
      });
    });

    describe('edge cases', () => {
      test('returns empty inner object for empty input', () => {
        const labels = provider2023.getTaskLabels([] as TaskResults);

        expect(labels).toEqual({ ICPCPrelim2023: {} });
      });
    });

    describe('override map path', () => {
      const TEST_YEAR = 9999;
      const TEST_CONTEST_ID = `ICPCPrelim${TEST_YEAR}`;

      const overrideTasks: TaskResults = [
        { contest_id: TEST_CONTEST_ID, task_id: '9001', task_table_index: '9001', title: 'Task One' },
        { contest_id: TEST_CONTEST_ID, task_id: '9002', task_table_index: '9002', title: 'Task Two' },
      ] as TaskResults;

      beforeEach(() => {
        ICPC_PRELIM_LABEL_OVERRIDES[TEST_CONTEST_ID] = {
          '9001': 'X',
          '9002': 'Y',
        };
      });

      afterEach(() => {
        delete ICPC_PRELIM_LABEL_OVERRIDES[TEST_CONTEST_ID];
      });

      test('returns custom labels from ICPC_PRELIM_LABEL_OVERRIDES', () => {
        const provider = createProvider(TEST_YEAR);
        const labels = provider.getTaskLabels(overrideTasks);

        expect(labels[TEST_CONTEST_ID]['9001']).toBe('X');
        expect(labels[TEST_CONTEST_ID]['9002']).toBe('Y');
      });
    });
  });
});
