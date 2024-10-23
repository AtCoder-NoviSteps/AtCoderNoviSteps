import { describe, it, expect } from 'vitest';
import { createTestCase, runTests } from './test_helpers';

describe('createTestCase', () => {
  it('expects to be created a test case object with the given name and value', () => {
    const name = 'the most simple test case with one argument';
    const value = 42;
    const testCase = createTestCase<number>(name)(value);

    expect(testCase).toEqual({ name, T: value });
  });
});

describe('runTests', () => {
  describe('expects to run multiple test cases with the given test function', () => {
    const testName = 'input value is multiplied by 2';
    const testCases = [
      { input: 1, expected: 2 },
      { input: 2, expected: 4 },
      { input: 3, expected: 6 },
    ];

    runTests(testName, testCases, (testCase: { input: number; expected: number }) => {
      describe(`${testName} - ${JSON.stringify(testCase)}`, () => {
        expect(testCase.input * 2).toBe(testCase.expected);
      });
    });
  });
});
