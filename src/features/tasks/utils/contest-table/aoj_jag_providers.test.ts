import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { JagPrelimProvider } from './aoj_jag_providers';

const createProvider = (year: number, suffix: '' | 'A' | 'B' = '') =>
  new JagPrelimProvider(ContestType.AOJ_JAG, year, suffix);

// JAGPrelim2005: 6 problems (A–F), oldest year on AOJ.
const tasks2005: TaskResults = [
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2006',
    task_table_index: '2006',
    title: 'Keitai Message',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2007',
    task_table_index: '2007',
    title: 'Make Purse Light',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2008',
    task_table_index: '2008',
    title: 'Dragon Fantasy',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2009',
    task_table_index: '2009',
    title: 'Area Separation',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2010',
    task_table_index: '2010',
    title: 'Poor Mail Forwarding',
  },
  {
    contest_id: 'JAGPrelim2005',
    task_id: '2011',
    task_table_index: '2011',
    title: 'Gather the Maps!',
  },
] as TaskResults;

// JAGPrelim2023: 8 problems (A–H), primary fixture.
const tasks2023: TaskResults = [
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3358',
    task_table_index: '3358',
    title: 'Sorting Crayons',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3359',
    task_table_index: '3359',
    title: 'Everyday is Holiday',
  },
  { contest_id: 'JAGPrelim2023', task_id: '3360', task_table_index: '3360', title: 'Game' },
  { contest_id: 'JAGPrelim2023', task_id: '3361', task_table_index: '3361', title: 'IPvK' },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3362',
    task_table_index: '3362',
    title: 'Watch the Marathon',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3363',
    task_table_index: '3363',
    title: 'Frog in a Well',
  },
  {
    contest_id: 'JAGPrelim2023',
    task_id: '3364',
    task_table_index: '3364',
    title: 'Watch the Movie',
  },
  { contest_id: 'JAGPrelim2023', task_id: '3365', task_table_index: '3365', title: 'Orienteering' },
] as TaskResults;

// JAGPrelim2026: 9 problems (A–I), latest year and maximum problem count.
const tasks2026: TaskResults = [
  { contest_id: 'JAGPrelim2026', task_id: '3452', task_table_index: '3452', title: 'Booby Prize' },
  { contest_id: 'JAGPrelim2026', task_id: '3453', task_table_index: '3453', title: 'Rearrange' },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3454',
    task_table_index: '3454',
    title: 'Loooong Vacation',
  },
  { contest_id: 'JAGPrelim2026', task_id: '3455', task_table_index: '3455', title: 'Box Tower' },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3456',
    task_table_index: '3456',
    title: 'Secret Numbers and the Greatest Common Divisor',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3457',
    task_table_index: '3457',
    title: 'ICPC is a Contest',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3458',
    task_table_index: '3458',
    title: 'XOR Travel Plans',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3459',
    task_table_index: '3459',
    title: 'Stone-Picking Game',
  },
  {
    contest_id: 'JAGPrelim2026',
    task_id: '3460',
    task_table_index: '3460',
    title: "Let's Build an Evil Robot Army",
  },
] as TaskResults;

// JAGPrelim2016 was held twice: A (2738–2744) and B (2745–2751), 7 problems each.
const tasks2016A: TaskResults = [
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2738',
    task_table_index: '2738',
    title: 'A-un Breathing',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2739',
    task_table_index: '2739',
    title: 'Delivery to a Luxurious House',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2740',
    task_table_index: '2740',
    title: 'Rooted Tree for Misawa-san',
  },
  { contest_id: 'JAGPrelim2016A', task_id: '2741', task_table_index: '2741', title: 'Invisible' },
  { contest_id: 'JAGPrelim2016A', task_id: '2742', task_table_index: '2742', title: 'Campaign' },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2743',
    task_table_index: '2743',
    title: 'Land Inheritance',
  },
  {
    contest_id: 'JAGPrelim2016A',
    task_id: '2744',
    task_table_index: '2744',
    title: 'Rings and Strings',
  },
] as TaskResults;

const tasks2016B: TaskResults = [
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2745',
    task_table_index: '2745',
    title: 'Curry Making',
  },
  { contest_id: 'JAGPrelim2016B', task_id: '2746', task_table_index: '2746', title: 'jfen' },
  { contest_id: 'JAGPrelim2016B', task_id: '2747', task_table_index: '2747', title: 'Curtain' },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2748',
    task_table_index: '2748',
    title: 'Early Morning Work at Summer Camp',
  },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2749',
    task_table_index: '2749',
    title: 'The Most Powerful Bed',
  },
  {
    contest_id: 'JAGPrelim2016B',
    task_id: '2750',
    task_table_index: '2750',
    title: 'Hyakunin Isshu',
  },
  { contest_id: 'JAGPrelim2016B', task_id: '2751', task_table_index: '2751', title: 'Baseball' },
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

        expect(table['JAGPrelim2023']['3358'].title).toBe('Sorting Crayons');
        expect(table['JAGPrelim2023']['3365'].title).toBe('Orienteering');
      });

      test('title is unchanged when generateTable is called twice (structurally idempotent)', () => {
        const firstTable = provider2023.generateTable(tasks2023);
        const secondInput = Object.values(firstTable['JAGPrelim2023']) as TaskResults;
        const secondTable = provider2023.generateTable(secondInput);

        expect(secondTable['JAGPrelim2023']['3358'].title).toBe('Sorting Crayons');
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
      test('returns indices sorted numerically ascending regardless of input order', () => {
        const reversedTasks = [...tasks2023].reverse() as TaskResults;

        expect(provider2023.getHeaderIdsForTask(reversedTasks)).toEqual([
          '3358',
          '3359',
          '3360',
          '3361',
          '3362',
          '3363',
          '3364',
          '3365',
        ]);
      });

      test('deduplicates repeated task_table_index values', () => {
        const duplicateTasks = [tasks2023[0], tasks2023[0]] as TaskResults;

        expect(provider2023.getHeaderIdsForTask(duplicateTasks)).toEqual(['3358']);
      });
    });

    describe('edge cases', () => {
      test('returns empty array for empty input', () => {
        expect(provider2023.getHeaderIdsForTask([] as TaskResults)).toEqual([]);
      });
    });
  });

  describe('getTaskLabels', () => {
    describe('successful cases', () => {
      test('returns letter map for all 8 tasks in numeric ID order (A–H)', () => {
        const labels = provider2023.getTaskLabels(tasks2023);

        expect(labels['JAGPrelim2023']['3358']).toBe('A');
        expect(labels['JAGPrelim2023']['3359']).toBe('B');
        expect(labels['JAGPrelim2023']['3365']).toBe('H');
      });

      test('returns object keyed by contestId', () => {
        const labels = provider2023.getTaskLabels(tasks2023);

        expect(Object.keys(labels)).toEqual(['JAGPrelim2023']);
      });
    });

    describe('edge cases', () => {
      test('returns empty inner object for empty input', () => {
        const labels = provider2023.getTaskLabels([] as TaskResults);

        expect(labels).toEqual({ JAGPrelim2023: {} });
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

      expect(table['JAGPrelim2026']['3452'].title).toBe('Booby Prize');
      expect(table['JAGPrelim2026']['3460'].title).toBe("Let's Build an Evil Robot Army");
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

    test('2016 A labels A–G keyed by JAGPrelim2016A', () => {
      const labels = provider2016A.getTaskLabels(tasks2016A);

      expect(labels['JAGPrelim2016A']['2738']).toBe('A');
      expect(labels['JAGPrelim2016A']['2744']).toBe('G');
    });

    test('2016 B labels A–G keyed by JAGPrelim2016B (letters restart from A)', () => {
      const labels = provider2016B.getTaskLabels(tasks2016B);

      expect(labels['JAGPrelim2016B']['2745']).toBe('A');
      expect(labels['JAGPrelim2016B']['2751']).toBe('G');
    });
  });
});
