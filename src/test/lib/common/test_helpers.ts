import { test } from 'vitest';

/**
 * Runs multiple test cases for a given test name using Vitest.
 * @template T The type of the test cases
 * @param {string} testName The base name for the tests
 * @param {T[]} testCases An array of test cases
 * @param {(testCase: T) => void} testFunction The function to execute for each test case
 */
export function runTests<T>(testName: string, testCases: T[], testFunction: (testCase: T) => void) {
  test.each(testCases)(`${testName} - %o`, testFunction);
}
