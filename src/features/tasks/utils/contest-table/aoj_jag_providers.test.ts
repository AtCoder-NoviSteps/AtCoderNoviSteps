import { describe, test, expect } from 'vitest';

import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResults } from '#lib/types/task.js';

import { JagPrelimProvider } from './aoj_jag_providers';

const createProvider = (year: number, suffix: '' | 'A' | 'B' = '') =>
  new JagPrelimProvider(ContestType.AOJ_JAG, year, suffix);

// JAGPrelim2005: 6 problems (A–F), oldest year on AOJ.
const tasks2005: TaskResults = [
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2006',
    task_table_index: 'A',
    title: 'Keitai Message',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2007',
    task_table_index: 'B',
    title: 'Make Purse Light',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2008',
    task_table_index: 'C',
    title: 'Dragon Fantasy',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2009',
    task_table_index: 'D',
    title: 'Area Separation',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2010',
    task_table_index: 'E',
    title: 'Poor Mail Forwarding',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2011',
    task_table_index: 'F',
    title: 'Gather the Maps!',
  },
] as TaskResults;

// JAGPrelim2023: 8 problems (A–H), primary fixture.
const tasks2023: TaskResults = [
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3358',
    task_table_index: 'A',
    title: 'Sorting Crayons',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3359',
    task_table_index: 'B',
    title: 'Everyday is Holiday',
  },
  { contest_id: 'JAGPrelim2023', task_id: '3360', task_table_index: 'C', title: 'Game' },
  { contest_id: 'JAGPrelim2023', task_id: '3361', task_table_index: 'D', title: 'IPvK' },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3362',
    task_table_index: 'E',
    title: 'Watch the Marathon',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3363',
    task_table_index: 'F',
    title: 'Frog in a Well',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3364',
    task_table_index: 'G',
    title: 'Watch the Movie',
  },
  { contest_id: 'JAGPrelim2023', task_id: '3365', task_table_index: 'H', title: 'Orienteering' },
] as TaskResults;

// JAGPrelim2026: 9 problems (A–I), latest year and maximum problem count.
const tasks2026: TaskResults = [
  { contest_id: 'JAGPrelim2026', task_id: '3452', task_table_index: 'A', title: 'Booby Prize' },
  { contest_id: 'JAGPrelim2026', task_id: '3453', task_table_index: 'B', title: 'Rearrange' },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3454',
    task_table_index: 'C',
    title: 'Loooong Vacation',
  },
  { contest_id: 'JAGPrelim2026', task_id: '3455', task_table_index: 'D', title: 'Box Tower' },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3456',
    task_table_index: 'E',
    title: 'Secret Numbers and the Greatest Common Divisor',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3457',
    task_table_index: 'F',
    title: 'ICPC is a Contest',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3458',
    task_table_index: 'G',
    title: 'XOR Travel Plans',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3459',
    task_table_index: 'H',
    title: 'Stone-Picking Game',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3460',
    task_table_index: 'I',
    title: "Let's Build an Evil Robot Army",
  },
] as TaskResults;

// JAGPrelim2016 was held twice: A (2738–2744) and B (2745–2751), 7 problems each.
const tasks2016A: TaskResults = [
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2738',
    task_table_index: 'A',
    title: 'A-un Breathing',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2739',
    task_table_index: 'B',
    title: 'Delivery to a Luxurious House',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2740',
    task_table_index: 'C',
    title: 'Rooted Tree for Misawa-san',
  },
  { contest_id: 'JAGPrelim2016A', task_id: '2741', task_table_index: 'D', title: 'Invisible' },
  { contest_id: 'JAGPrelim2016A', task_id: '2742', task_table_index: 'E', title: 'Campaign' },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2743',
    task_table_index: 'F',
    title: 'Land Inheritance',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2744',
    task_table_index: 'G',
    title: 'Rings and Strings',
  },
] as TaskResults;

const tasks2016B: TaskResults = [
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2745',
    task_table_index: 'A',
    title: 'Curry Making',
  },
  { contest_id: 'JAGPrelim2016B', task_id: '2746', task_table_index: 'B', title: 'jfen' },
  { contest_id: 'JAGPrelim2016B', task_id: '2747', task_table_index: 'C', title: 'Curtain' },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2748',
    task_table_index: 'D',
    title: 'Early Morning Work at Summer Camp',
  },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2749',
    task_table_index: 'E',
    title: 'The Most Powerful Bed',
  },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2750',
    task_table_index: 'F',
    title: 'Hyakunin Isshu',
  },
  { contest_id: 'JAGPrelim2016B', task_id: '2751', task_table_index: 'G', title: 'Baseball' },
] as TaskResults;

describe('JagPrelimProvider', () => {
  const provider2023 = createProvider(2023);

  describe('filter', () => {
    const mixedTasks = [
      ...tasks2023,
      ...tasks2005,
      { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A', title: 'Not JAG' },
    ] as TaskResults;

    describe('successful cases', () => {
      test('returns only tasks belonging to the given year contest', () => {
        const filtered = provider2023.filter(mixedTasks);

        expect(filtered).toHaveLength(8);
        expect(filtered.every((task) => task.contest_id === 'JAGPrelim2023')).toBe(true);
      });

      test('excludes tasks from other JAG years', () => {
        const filtered = provider2023.filter(mixedTasks);

        expect(filtered.some((task) => task.contest_id === 'JAGPrelim2005')).toBe(false);
      });

      test('excludes tasks from non-JAG contests', () => {
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

        expect(table['JAGPrelim2023']['A'].title).toBe('Sorting Crayons');
        expect(table['JAGPrelim2023']['H'].title).toBe('Orienteering');
      });

      test('title is unchanged when generateTable is called twice (structurally idempotent)', () => {
        const firstTable = provider2023.generateTable(tasks2023);
        const secondInput = Object.values(firstTable['JAGPrelim2023']) as TaskResults;
        const secondTable = provider2023.generateTable(secondInput);

        expect(secondTable['JAGPrelim2023']['A'].title).toBe('Sorting Crayons');
      });

      test('creates table keyed by contest_id', () => {
        const table = provider2023.generateTable(tasks2023);

        expect(Object.keys(table)).toEqual(['JAGPrelim2023']);
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
      expect(provider2023.getMetadata().title).toBe('JAG 模擬国内 2023');
    });

    test('returns correct abbreviationName with year', () => {
      expect(provider2023.getMetadata().abbreviationName).toBe('jagPrelim2023');
    });

    test('returns titleStyle with text-xl font size, font-bold weight, pb-1 gap, h2 heading tag', () => {
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

    test('returns isShownTaskIndex as true', () => {
      expect(provider2023.getDisplayConfig().isShownTaskIndex).toBe(true);
    });

    test('returns columnWrapThreshold as 6', () => {
      expect(provider2023.getDisplayConfig().columnWrapThreshold).toBe(6);
    });
  });

  describe('getContestRoundLabel', () => {
    test('returns label with year', () => {
      expect(provider2023.getContestRoundLabel('JAGPrelim2023')).toBe('JAG 模擬国内 2023');
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
    const provider2005 = createProvider(2005);
    const provider2026 = createProvider(2026);

    test('oldest year 2005 returns correct metadata (6 problems)', () => {
      expect(provider2005.getMetadata().title).toBe('JAG 模擬国内 2005');
      expect(provider2005.getMetadata().abbreviationName).toBe('jagPrelim2005');
    });

    test('oldest year 2005 filter isolates its own contest_id', () => {
      const mixed = [...tasks2005, ...tasks2023] as TaskResults;
      const filtered = provider2005.filter(mixed);

      expect(filtered).toHaveLength(6);
      expect(filtered.every((task) => task.contest_id === 'JAGPrelim2005')).toBe(true);
    });

    test('latest year 2026 returns correct metadata (9 problems)', () => {
      expect(provider2026.getMetadata().title).toBe('JAG 模擬国内 2026');
      expect(provider2026.getMetadata().abbreviationName).toBe('jagPrelim2026');
    });

    test('latest year 2026 stores raw titles (maximum problem count)', () => {
      const table = provider2026.generateTable(tasks2026);

      expect(table['JAGPrelim2026']['A'].title).toBe('Booby Prize');
      expect(table['JAGPrelim2026']['I'].title).toBe("Let's Build an Evil Robot Army");
    });
  });

  describe('2016 A/B split', () => {
    const provider2016A = createProvider(2016, 'A');
    const provider2016B = createProvider(2016, 'B');

    test('2016 A targets contest_id JAGPrelim2016A with a distinct provider key', () => {
      expect(provider2016A.getProviderKey()).toBe('AOJ_JAG::2016A');
    });

    test('2016 B targets contest_id JAGPrelim2016B with a distinct provider key', () => {
      expect(provider2016B.getProviderKey()).toBe('AOJ_JAG::2016B');
    });

    test('2016 A title reads "JAG 模擬国内 2016 A"', () => {
      expect(provider2016A.getMetadata().title).toBe('JAG 模擬国内 2016 A');
      expect(provider2016A.getContestRoundLabel('JAGPrelim2016A')).toBe('JAG 模擬国内 2016 A');
    });

    test('2016 B title reads "JAG 模擬国内 2016 B"', () => {
      expect(provider2016B.getMetadata().title).toBe('JAG 模擬国内 2016 B');
    });

    test('2016 A and B abbreviationNames are distinct', () => {
      expect(provider2016A.getMetadata().abbreviationName).toBe('jagPrelim2016A');
      expect(provider2016B.getMetadata().abbreviationName).toBe('jagPrelim2016B');
    });

    test('2016 A filter isolates JAGPrelim2016A from JAGPrelim2016B', () => {
      const mixed = [...tasks2016A, ...tasks2016B] as TaskResults;
      const filtered = provider2016A.filter(mixed);

      expect(filtered).toHaveLength(7);
      expect(filtered.every((task) => task.contest_id === 'JAGPrelim2016A')).toBe(true);
    });

    test('2016 B filter isolates JAGPrelim2016B from JAGPrelim2016A', () => {
      const mixed = [...tasks2016A, ...tasks2016B] as TaskResults;
      const filtered = provider2016B.filter(mixed);

      expect(filtered).toHaveLength(7);
      expect(filtered.every((task) => task.contest_id === 'JAGPrelim2016B')).toBe(true);
    });

    test('2016 A and B tables are each keyed by letters A–G', () => {
      const tableA = provider2016A.generateTable(tasks2016A);
      const tableB = provider2016B.generateTable(tasks2016B);

      expect(tableA['JAGPrelim2016A']['A'].title).toBe('A-un Breathing');
      expect(tableA['JAGPrelim2016A']['G'].title).toBe('Rings and Strings');
      expect(tableB['JAGPrelim2016B']['A'].title).toBe('Curry Making');
      expect(tableB['JAGPrelim2016B']['G'].title).toBe('Baseball');
    });
  });
});
