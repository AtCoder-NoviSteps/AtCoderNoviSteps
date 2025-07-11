import { expect, test } from 'vitest';
import { parseWorkBookId, parseWorkBookUrlSlug } from '$lib/utils/workbook';

type TestCase = {
  slug: string;
  expected: number | string | null;
};

type TestCases = TestCase[];

describe('Workbook', () => {
  describe('parse workbook id from URL', () => {
    describe('when only positive integers are given', () => {
      const testCases = [
        { slug: '1', expected: 1 },
        { slug: '2', expected: 2 },
        { slug: '100', expected: 100 },
        { slug: '9007199254740990', expected: Number.MAX_SAFE_INTEGER - 1 },
        { slug: '9007199254740991', expected: Number.MAX_SAFE_INTEGER },
      ];

      runTests('parseWorkBookId', testCases, ({ slug, expected }: TestCase) => {
        expect(parseWorkBookId(slug)).toBe(expected);
      });
    });

    describe('when a decimal or an integer less than or equal to 0 are given', () => {
      const testCases = [
        { slug: '-1000000000000000000000000000', expected: null },
        { slug: String(Number.MIN_SAFE_INTEGER - 1), expected: null },
        { slug: '-2', expected: null },
        { slug: '-1', expected: null },
        { slug: '0', expected: null },
        { slug: '-1.1', expected: null },
        { slug: '-0.5', expected: null },
        { slug: '-0.1', expected: null },
        { slug: '0.1', expected: null },
        { slug: '0.5', expected: null },
        { slug: '1.1', expected: null },
      ];

      runTests('parseWorkBookId', testCases, ({ slug, expected }: TestCase) => {
        expect(parseWorkBookId(slug)).toBe(expected);
      });
    });

    describe('when beyond Number.MAX_SAFE_INTEGER or significant decimals are given', () => {
      const testCases = [
        { slug: '9007199254740991.1', expected: null },
        { slug: '9007199254740991.5', expected: null },
        { slug: String(Number.MAX_SAFE_INTEGER + 1), expected: null },
        { slug: '10000000000000000', expected: null },
      ];

      runTests('parseWorkBookId', testCases, ({ slug, expected }: TestCase) => {
        expect(parseWorkBookId(slug)).toBe(expected);
      });
    });

    describe('when alphanumeric or decimals are included', () => {
      const testCases = [
        { slug: 'AtCoder', expected: null },
        { slug: 'abc999', expected: null },
        { slug: '1.5', expected: null },
      ];

      runTests('parseWorkBookId', testCases, ({ slug, expected }: TestCase) => {
        expect(parseWorkBookId(slug)).toBe(expected);
      });
    });

    describe('when empty string(s) are included', () => {
      const testCases = [
        { slug: '', expected: null },
        { slug: ' ', expected: null },
        { slug: ' abc999 ', expected: null },
      ];

      runTests('parseWorkBookId', testCases, ({ slug, expected }: TestCase) => {
        expect(parseWorkBookId(slug)).toBe(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCases,
      testFunction: (testCase: TestCase) => void,
    ) {
      test.each(testCases)(`${testName}(slug: $slug)`, testFunction);
    }
  });
});

describe('parse workbook URL slug', () => {
  describe('when valid URL slugs are given', () => {
    const testCases = [
      { slug: 'a', expected: 'a' },
      { slug: 'a'.repeat(30), expected: 'a'.repeat(30) },
      { slug: 'bfs', expected: 'bfs' },
      { slug: 'union-find', expected: 'union-find' },
      { slug: '2-sat', expected: '2-sat' },
    ];

    runTests('parseWorkBookUrlSlug', testCases, ({ slug, expected }: TestCase) => {
      expect(parseWorkBookUrlSlug(slug)).toBe(expected);
    });
  });

  describe('when invalid URL slugs are given', () => {
    const testCases = [
      { slug: '', expected: null },
      { slug: ' ', expected: null },
      { slug: '1', expected: null },
      { slug: '2', expected: null },
      { slug: '9', expected: null },
      { slug: '10', expected: null },
      { slug: '99', expected: null },
      { slug: '100', expected: null },
      { slug: 'bfs dfs', expected: null },
      { slug: 'invalid@slug', expected: null },
      { slug: 'invalid#slug', expected: null },
      { slug: 'invalid/slug', expected: null },
      { slug: 'UPPERCASE', expected: null },
      { slug: 'slug_with_underscore', expected: null },
      { slug: '-invalid-start', expected: null },
      { slug: 'invalid-end-', expected: null },
      { slug: 'double--dash', expected: null },
    ];

    runTests('parseWorkBookUrlSlug', testCases, ({ slug, expected }: TestCase) => {
      expect(parseWorkBookUrlSlug(slug)).toBe(expected);
    });
  });

  function runTests(
    testName: string,
    testCases: TestCases,
    testFunction: (testCase: TestCase) => void,
  ) {
    test.each(testCases)(`${testName}(slug: $slug)`, testFunction);
  }
});
