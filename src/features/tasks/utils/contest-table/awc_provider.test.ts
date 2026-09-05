import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { AWCRangeProvider, AWCSpecialContestProvider } from './awc_provider';
import {
  taskResultsForAWC0001To0099Provider,
  taskResultsForAWC0100Provider,
  taskResultsForAWC0101To0149Provider,
  taskResultsForAWC0150Provider,
  taskResultsForAWC0151OnwardsProvider,
} from '$features/tasks/fixtures/contest-table/contest_table_provider';

const allAWCTaskResults: TaskResults = [
  ...taskResultsForAWC0001To0099Provider,
  ...taskResultsForAWC0100Provider,
  ...taskResultsForAWC0101To0149Provider,
  ...taskResultsForAWC0150Provider,
  ...taskResultsForAWC0151OnwardsProvider,
];

const RANGE_PROBLEMS = ['A', 'B', 'C', 'D', 'E'];
const SPECIAL_PROBLEMS = [
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
];

describe('AWCRangeProvider', () => {
  const rangeProviderCases = [
    {
      name: 'AWC0151Onwards',
      config: {
        section: '0151Onwards',
        minRound: 151,
        maxRound: 9999,
        title: 'AtCoder Weekday Contest 0151 〜',
        abbreviationName: 'awc0151Onwards',
      },
      includedContestIds: ['awc0151', 'awc0152'],
      excludedContestIds: ['awc0150', 'awc0149', 'awc0100'],
      fixtureData: taskResultsForAWC0151OnwardsProvider,
      roundLabelCases: [
        { contestId: 'awc0151', expected: '0151' },
        { contestId: 'awc0200', expected: '0200' },
      ],
    },
    {
      name: 'AWC0101To0149',
      config: {
        section: '0101To0149',
        minRound: 101,
        maxRound: 149,
        title: 'AtCoder Weekday Contest 0101 〜 0149',
        abbreviationName: 'awc0101To0149',
      },
      includedContestIds: ['awc0101', 'awc0102', 'awc0149'],
      excludedContestIds: ['awc0099', 'awc0100', 'awc0150'],
      fixtureData: taskResultsForAWC0101To0149Provider,
      roundLabelCases: [
        { contestId: 'awc0101', expected: '0101' },
        { contestId: 'awc0149', expected: '0149' },
      ],
    },
    {
      name: 'AWC0001To0099',
      config: {
        section: '0001To0099',
        minRound: 1,
        maxRound: 99,
        title: 'AtCoder Weekday Contest 0001 〜 0099',
        abbreviationName: 'awc0001To0099',
      },
      includedContestIds: ['awc0001', 'awc0002', 'awc0099'],
      excludedContestIds: ['awc0100'],
      fixtureData: taskResultsForAWC0001To0099Provider,
      roundLabelCases: [
        { contestId: 'awc0001', expected: '0001' },
        { contestId: 'awc0099', expected: '0099' },
      ],
    },
  ];

  describe.each(rangeProviderCases)('$name', (testCase) => {
    const createProvider = () => new AWCRangeProvider(ContestType.AWC, testCase.config);

    test('filters correct contest range from mixed data', () => {
      const provider = createProvider();
      const filtered = provider.filter(allAWCTaskResults);

      expect(filtered.length).toBeGreaterThan(0);

      for (const id of testCase.includedContestIds) {
        expect(filtered.some((task) => task.contest_id === id)).toBe(true);
      }

      for (const id of testCase.excludedContestIds) {
        expect(filtered.some((task) => task.contest_id === id)).toBe(false);
      }
    });

    test('returns correct metadata', () => {
      const provider = createProvider();
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe(testCase.config.title);
      expect(metadata.abbreviationName).toBe(testCase.config.abbreviationName);
    });

    test('generates table with expected problems per contest', () => {
      const provider = createProvider();
      const filtered = provider.filter(testCase.fixtureData);
      const table = provider.generateTable(filtered);

      const contests = Object.values(table);
      expect(contests.length).toBeGreaterThan(0);

      contests.forEach((problems) => {
        expect(Object.keys(problems)).toEqual(RANGE_PROBLEMS);
      });
    });

    test.each(testCase.roundLabelCases)(
      'formats round label for $contestId',
      ({ contestId, expected }) => {
        const provider = createProvider();
        expect(provider.getContestRoundLabel(contestId)).toBe(expected);
      },
    );

    test('returns empty array for empty input', () => {
      const provider = createProvider();
      expect(provider.filter([] as TaskResults)).toEqual([]);
    });
  });

  test('all range providers share the same display config', () => {
    const configs = rangeProviderCases.map((testCase) =>
      new AWCRangeProvider(ContestType.AWC, testCase.config).getDisplayConfig(),
    );

    for (const config of configs) {
      expect(config).toEqual(configs[0]);
    }

    expect(configs[0]).toEqual({
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1',
      isShownTaskIndex: false,
    });
  });
});

describe('AWCSpecialContestProvider', () => {
  const specialContestCases = [
    {
      name: 'AWC0150',
      config: {
        section: '0150',
        contestId: 'awc0150',
        title: 'AtCoder Weekday Contest 0150',
        abbreviationName: 'awc0150',
      },
      fixtureData: taskResultsForAWC0150Provider,
      mixedData: [...taskResultsForAWC0101To0149Provider, ...taskResultsForAWC0150Provider],
      excludedContestIds: ['awc0101', 'awc0149'],
    },
    {
      name: 'AWC0100',
      config: {
        section: '0100',
        contestId: 'awc0100',
        title: 'AtCoder Weekday Contest 0100',
        abbreviationName: 'awc0100',
      },
      fixtureData: taskResultsForAWC0100Provider,
      mixedData: [...taskResultsForAWC0001To0099Provider, ...taskResultsForAWC0100Provider],
      excludedContestIds: ['awc0001', 'awc0099'],
    },
  ];

  describe.each(specialContestCases)('$name', (testCase) => {
    const createProvider = () => new AWCSpecialContestProvider(ContestType.AWC, testCase.config);

    test('filters only the target contest from mixed data', () => {
      const provider = createProvider();
      const filtered = provider.filter(testCase.mixedData);

      expect(filtered.length).toBe(SPECIAL_PROBLEMS.length);
      expect(filtered.every((task) => task.contest_id === testCase.config.contestId)).toBe(true);
    });

    test('excludes adjacent contests', () => {
      const provider = createProvider();
      const filtered = provider.filter(testCase.mixedData);

      for (const id of testCase.excludedContestIds) {
        expect(filtered.some((task) => task.contest_id === id)).toBe(false);
      }
    });

    test('returns correct metadata', () => {
      const provider = createProvider();
      const metadata = provider.getMetadata();

      expect(metadata.title).toBe(testCase.config.title);
      expect(metadata.abbreviationName).toBe(testCase.config.abbreviationName);
    });

    test('generates table with expected problems', () => {
      const provider = createProvider();
      const filtered = provider.filter(testCase.fixtureData);
      const table = provider.generateTable(filtered);

      expect(table).toHaveProperty(testCase.config.contestId);
      expect(Object.keys(table[testCase.config.contestId])).toEqual(SPECIAL_PROBLEMS);
    });

    test('returns empty round label', () => {
      const provider = createProvider();
      expect(provider.getContestRoundLabel(testCase.config.contestId)).toBe('');
    });

    test('returns empty array for empty input', () => {
      const provider = createProvider();
      expect(provider.filter([] as TaskResults)).toEqual([]);
    });
  });

  test('all special-contest providers share the same display config', () => {
    const configs = specialContestCases.map((testCase) =>
      new AWCSpecialContestProvider(ContestType.AWC, testCase.config).getDisplayConfig(),
    );

    for (const config of configs) {
      expect(config).toEqual(configs[0]);
    }

    expect(configs[0]).toEqual({
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    });
  });
});
