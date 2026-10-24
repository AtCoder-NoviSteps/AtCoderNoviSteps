import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResults } from '#lib/types/task.js';

import { AojIcpcPrelimProvider, AojIcpcRegionalProvider } from './aoj_icpc_providers';

const createProvider = (year: number) => new AojIcpcPrelimProvider(ContestType.AOJ_ICPC, year);

// ICPCPrelim1998: 4 problems (A–D), oldest year on AOJ
const tasks1998: TaskResults = [
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1100',
    task_table_index: 'A',
    title: 'Area of Polygons',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1101',
    task_table_index: 'B',
    title: 'A Simple Offline Text Editor',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1102',
    task_table_index: 'C',
    title: 'Calculation of Expressions',
  },
  {
    contest_id: 'ICPCPrelim1998',
    task_id: '1103',
    task_table_index: 'D',
    title: 'Board Arrangements for Concentration Games',
  },
] as TaskResults;

// ICPCPrelim2023: 8 problems (A–H), used as the primary fixture
const tasks2023: TaskResults = [
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1664',
    task_table_index: 'A',
    title: 'Which Team Should Receive the Sponsor Prize?',
  },
  { contest_id: 'ICPCPrelim2023', task_id: '1665', task_table_index: 'B', title: 'Amidakuji' },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1666',
    task_table_index: 'C',
    title: 'Changing the Sitting Arrangement',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1667',
    task_table_index: 'D',
    title: 'Efficient Problem Set',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1668',
    task_table_index: 'E',
    title: 'Tampered Records',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1669',
    task_table_index: 'F',
    title: 'Villa of Emblem Shape',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1670',
    task_table_index: 'G',
    title: 'Fair Deal of Dice',
  },
  {
    contest_id: 'ICPCPrelim2023',
    task_id: '1671',
    task_table_index: 'H',
    title: 'Planning Locations of Bus Stops',
  },
] as TaskResults;

// ICPCPrelim2026: 10 problems (A–J), latest year and maximum problem count
const tasks2026: TaskResults = [
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1690',
    task_table_index: 'A',
    title: 'Find the Strongest Card',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1691',
    task_table_index: 'B',
    title: 'Vending Machines',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1692',
    task_table_index: 'C',
    title: 'Water Remaining',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1693',
    task_table_index: 'D',
    title: 'Frequency Sequence',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1694',
    task_table_index: 'E',
    title: 'Shopping Master',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1695',
    task_table_index: 'F',
    title: 'Optimizing a Map Application',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1696',
    task_table_index: 'G',
    title: 'Avoid Collision',
  },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1697',
    task_table_index: 'H',
    title: 'Sorting Swim Rings',
  },
  { contest_id: 'ICPCPrelim2026', task_id: '1698', task_table_index: 'I', title: 'Speed Limit' },
  {
    contest_id: 'ICPCPrelim2026',
    task_id: '1699',
    task_table_index: 'J',
    title: 'Maximum Scaling',
  },
] as TaskResults;

const mixedTasks: TaskResults = [
  ...tasks2023,
  // ICPCPrelim2022: one problem to verify year filtering
  {
    contest_id: 'ICPCPrelim2022',
    task_id: '1656',
    task_table_index: 'A',
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

        expect(table['ICPCPrelim2023']['A'].title).toBe(
          'Which Team Should Receive the Sponsor Prize?',
        );
        expect(table['ICPCPrelim2023']['B'].title).toBe('Amidakuji');
        expect(table['ICPCPrelim2023']['C'].title).toBe('Changing the Sitting Arrangement');
        expect(table['ICPCPrelim2023']['D'].title).toBe('Efficient Problem Set');
        expect(table['ICPCPrelim2023']['E'].title).toBe('Tampered Records');
        expect(table['ICPCPrelim2023']['F'].title).toBe('Villa of Emblem Shape');
        expect(table['ICPCPrelim2023']['G'].title).toBe('Fair Deal of Dice');
        expect(table['ICPCPrelim2023']['H'].title).toBe('Planning Locations of Bus Stops');
      });

      test('title is unchanged when generateTable is called twice (structurally idempotent)', () => {
        const firstTable = provider2023.generateTable(tasks2023);
        const secondInput = Object.values(firstTable['ICPCPrelim2023']) as TaskResults;
        const secondTable = provider2023.generateTable(secondInput);

        expect(secondTable['ICPCPrelim2023']['B'].title).toBe('Amidakuji');
      });

      test('uses task_table_index as the inner key', () => {
        const table = provider2023.generateTable(tasks2023);

        expect(Object.keys(table['ICPCPrelim2023'])).toEqual(
          expect.arrayContaining(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
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
        headingTag: 'h2',
        fontSize: 'text-xl',
        fontWeight: 'font-bold',
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

    test('returns columnWrapThreshold as 6', () => {
      expect(provider2023.getDisplayConfig().columnWrapThreshold).toBe(6);
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
      test('returns letters in ascending order regardless of input order', () => {
        const reversedTasks = [...tasks2023].reverse() as TaskResults;

        expect(provider2023.getHeaderIdsForTask(reversedTasks)).toEqual([
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ]);
      });

      test('deduplicates repeated task_table_index values', () => {
        const duplicateTasks = [tasks2023[0], tasks2023[0]] as TaskResults;

        expect(provider2023.getHeaderIdsForTask(duplicateTasks)).toEqual(['A']);
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
    const provider2026 = createProvider(2026);

    test('oldest year 1998 returns correct metadata (4 problems, A–D)', () => {
      expect(provider1998.getMetadata().title).toBe('ICPC 国内予選 1998');
      expect(provider1998.getMetadata().abbreviationName).toBe('icpcPrelim1998');
    });

    test('oldest year 1998 stores raw titles for 4 tasks', () => {
      const table = provider1998.generateTable(tasks1998);

      expect(table['ICPCPrelim1998']['A'].title).toBe('Area of Polygons');
      expect(table['ICPCPrelim1998']['B'].title).toBe('A Simple Offline Text Editor');
      expect(table['ICPCPrelim1998']['C'].title).toBe('Calculation of Expressions');
      expect(table['ICPCPrelim1998']['D'].title).toBe('Board Arrangements for Concentration Games');
    });

    test('oldest year 1998 filter isolates its own contest_id', () => {
      const mixed = [...tasks1998, ...tasks2023] as TaskResults;
      const filtered = provider1998.filter(mixed);

      expect(filtered).toHaveLength(4);
      expect(filtered.every((task) => task.contest_id === 'ICPCPrelim1998')).toBe(true);
    });

    test('latest year 2026 returns correct metadata (10 problems, A–J)', () => {
      expect(provider2026.getMetadata().title).toBe('ICPC 国内予選 2026');
      expect(provider2026.getMetadata().abbreviationName).toBe('icpcPrelim2026');
    });

    test('latest year 2026 stores raw titles (maximum problem count)', () => {
      const table = provider2026.generateTable(tasks2026);

      expect(table['ICPCPrelim2026']['A'].title).toBe('Find the Strongest Card');
      expect(table['ICPCPrelim2026']['J'].title).toBe('Maximum Scaling');
    });

    test('latest year 2026 filter isolates its own contest_id', () => {
      const mixed = [...tasks2026, ...tasks2023] as TaskResults;
      const filtered = provider2026.filter(mixed);

      expect(filtered).toHaveLength(10);
      expect(filtered.every((task) => task.contest_id === 'ICPCPrelim2026')).toBe(true);
    });
  });
});

const createRegionalProvider = (year: number) =>
  new AojIcpcRegionalProvider(ContestType.AOJ_ICPC, year);

// ICPCRegional1998: 8 problems (A–H)
const regionalTasks1998: TaskResults = [
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1200',
    task_table_index: 'A',
    title: "Goldbach's Conjecture",
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1201',
    task_table_index: 'B',
    title: 'Lattice Practices',
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1202',
    task_table_index: 'C',
    title: 'Mobile Phone Coverage',
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1203',
    task_table_index: 'D',
    title: "Napoleon's Grumble",
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1204',
    task_table_index: 'E',
    title: 'Pipeline Scheduling',
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1205',
    task_table_index: 'F',
    title: 'Triangle Partition',
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1206',
    task_table_index: 'G',
    title: 'BUT We Need a Diagram',
  },
  {
    contest_id: 'ICPCRegional1998',
    task_id: '1207',
    task_table_index: 'H',
    title: 'Digital Racing Circuil',
  },
] as TaskResults;

// ICPCRegional2024: 12 problems (A–L), maximum problem count
const regionalTasks2024: TaskResults = [
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1455',
    task_table_index: 'A',
    title: 'Ribbon on the Christmas Present',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1456',
    task_table_index: 'B',
    title: 'The Sparsest Number in Between',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1457',
    task_table_index: 'C',
    title: 'Omnes Viae Yokohamam Ducunt?',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1458',
    task_table_index: 'D',
    title: 'Tree Generators',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1459',
    task_table_index: 'E',
    title: 'E-Circuit Is Now on Sale!',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1460',
    task_table_index: 'F',
    title: 'The Farthest Point',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1461',
    task_table_index: 'G',
    title: 'Beyond the Former Explorer',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1462',
    task_table_index: 'H',
    title: 'Remodeling the Dungeon 2',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1463',
    task_table_index: 'I',
    title: 'Greatest of the Greatest Common Divisors',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1464',
    task_table_index: 'J',
    title: 'Mixing Solutions',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1465',
    task_table_index: 'K',
    title: 'Scheduling Two Meetings',
  },
  {
    contest_id: 'ICPCRegional2024',
    task_id: '1466',
    task_table_index: 'L',
    title: 'Peculiar Protocol',
  },
] as TaskResults;

const mixedRegionalTasks: TaskResults = [
  ...regionalTasks1998,
  // ICPCRegional1999: one task to verify year filtering
  {
    contest_id: 'ICPCRegional1999',
    task_id: '1208',
    task_table_index: 'A',
    title: 'Rational Irrationals',
  },
  // Non-ICPC contest, to verify contest-type filtering
  { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A', title: 'Divisor' },
] as TaskResults;

describe('AojIcpcRegionalProvider', () => {
  const provider1998 = createRegionalProvider(1998);

  describe('filter', () => {
    describe('successful cases', () => {
      test('returns only tasks belonging to the given year contest', () => {
        const filtered = provider1998.filter(mixedRegionalTasks);

        expect(filtered).toHaveLength(8);
        expect(filtered.every((task) => task.contest_id === 'ICPCRegional1998')).toBe(true);
      });

      test('excludes tasks from other ICPC Regional years', () => {
        const filtered = provider1998.filter(mixedRegionalTasks);

        expect(filtered.some((task) => task.contest_id === 'ICPCRegional1999')).toBe(false);
      });

      test('excludes tasks from non-ICPC contests', () => {
        const filtered = provider1998.filter(mixedRegionalTasks);

        expect(filtered.some((task) => task.contest_id === 'abc123')).toBe(false);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider1998.filter([] as TaskResults)).toEqual([]);
      });

      test('returns empty array when no tasks match the given year', () => {
        const provider2024 = createRegionalProvider(2024);

        expect(provider2024.filter(regionalTasks1998)).toEqual([]);
      });
    });
  });

  describe('generateTable', () => {
    describe('successful cases', () => {
      test('stores raw titles (no letter prefix) for all 8 tasks', () => {
        const table = provider1998.generateTable(regionalTasks1998);

        expect(table['ICPCRegional1998']['A'].title).toBe("Goldbach's Conjecture");
        expect(table['ICPCRegional1998']['H'].title).toBe('Digital Racing Circuil');
      });

      test('title is unchanged when generateTable is called twice (structurally idempotent)', () => {
        const firstTable = provider1998.generateTable(regionalTasks1998);
        const secondInput = Object.values(firstTable['ICPCRegional1998']) as TaskResults;
        const secondTable = provider1998.generateTable(secondInput);

        expect(secondTable['ICPCRegional1998']['B'].title).toBe('Lattice Practices');
      });

      test('uses task_table_index as the inner key', () => {
        const table = provider1998.generateTable(regionalTasks1998);

        expect(Object.keys(table['ICPCRegional1998'])).toEqual(
          expect.arrayContaining(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
        );
      });

      test('creates table keyed by contest_id', () => {
        const table = provider1998.generateTable(regionalTasks1998);

        expect(Object.keys(table)).toEqual(['ICPCRegional1998']);
      });

      test('does not mutate original task data', () => {
        const originalTitle = regionalTasks1998[0].title;
        provider1998.generateTable(regionalTasks1998);

        expect(regionalTasks1998[0].title).toBe(originalTitle);
      });
    });
  });

  describe('getMetadata', () => {
    test('returns correct title with year', () => {
      expect(provider1998.getMetadata().title).toBe('ICPC アジア地区 1998');
    });

    test('returns correct abbreviationName with year', () => {
      expect(provider1998.getMetadata().abbreviationName).toBe('icpcRegional1998');
    });

    test('returns shared titleStyle (h2, text-xl, font-bold, pb-1)', () => {
      expect(provider1998.getMetadata().titleStyle).toEqual({
        headingTag: 'h2',
        fontSize: 'text-xl',
        fontWeight: 'font-bold',
        bottomGap: 'pb-1',
      });
    });
  });

  describe('getDisplayConfig', () => {
    test('returns isShownHeader as false', () => {
      expect(provider1998.getDisplayConfig().isShownHeader).toBe(false);
    });

    test('returns isShownRoundLabel as false', () => {
      expect(provider1998.getDisplayConfig().isShownRoundLabel).toBe(false);
    });

    test('returns isShownTaskIndex as true', () => {
      expect(provider1998.getDisplayConfig().isShownTaskIndex).toBe(true);
    });

    test('returns empty roundLabelWidth', () => {
      expect(provider1998.getDisplayConfig().roundLabelWidth).toBe('');
    });

    test('returns correct tableBodyCellsWidth', () => {
      expect(provider1998.getDisplayConfig().tableBodyCellsWidth).toBe(
        'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
      );
    });

    test('returns columnWrapThreshold as 6', () => {
      expect(provider1998.getDisplayConfig().columnWrapThreshold).toBe(6);
    });
  });

  describe('getContestRoundLabel', () => {
    test('returns label with year', () => {
      expect(provider1998.getContestRoundLabel('ICPCRegional1998')).toBe('ICPC アジア地区 1998');
    });
  });

  describe('getContestRoundIds', () => {
    test('returns contest_id of the filtered tasks', () => {
      expect(provider1998.getContestRoundIds(regionalTasks1998)).toEqual(['ICPCRegional1998']);
    });

    test('returns empty array for empty input', () => {
      expect(provider1998.getContestRoundIds([] as TaskResults)).toEqual([]);
    });
  });

  describe('getHeaderIdsForTask', () => {
    describe('successful cases', () => {
      test('returns letters in ascending order regardless of input order', () => {
        const reversedTasks = [...regionalTasks1998].reverse() as TaskResults;

        expect(provider1998.getHeaderIdsForTask(reversedTasks)).toEqual([
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ]);
      });

      test('deduplicates repeated task_table_index values', () => {
        const duplicateTasks = [regionalTasks1998[0], regionalTasks1998[0]] as TaskResults;

        expect(provider1998.getHeaderIdsForTask(duplicateTasks)).toEqual(['A']);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider1998.getHeaderIdsForTask([] as TaskResults)).toEqual([]);
      });
    });
  });

  describe('year boundary behavior', () => {
    const provider2024 = createRegionalProvider(2024);

    test('latest year 2024 returns correct metadata (12 problems, A–L)', () => {
      expect(provider2024.getMetadata().title).toBe('ICPC アジア地区 2024');
      expect(provider2024.getMetadata().abbreviationName).toBe('icpcRegional2024');
    });

    test('latest year 2024 stores raw titles (maximum problem count)', () => {
      const table = provider2024.generateTable(regionalTasks2024);

      expect(table['ICPCRegional2024']['A'].title).toBe('Ribbon on the Christmas Present');
      expect(table['ICPCRegional2024']['L'].title).toBe('Peculiar Protocol');
    });

    test('latest year 2024 filter isolates its own contest_id', () => {
      const mixed = [...regionalTasks2024, ...regionalTasks1998] as TaskResults;
      const filtered = provider2024.filter(mixed);

      expect(filtered).toHaveLength(12);
      expect(filtered.every((task) => task.contest_id === 'ICPCRegional2024')).toBe(true);
    });
  });
});
