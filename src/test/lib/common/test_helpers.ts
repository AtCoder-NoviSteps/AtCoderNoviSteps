import { test } from 'vitest';

interface TestCase<T> {
  name: string;
  T: T;
}

/**
 * Creates a test case object with a given name and value.
 *
 * @template T - The type of the value to be included in the test case.
 * @param {string} name - The name of the test case.
 * @returns {(T: T) => { name: string; T: T }} - A function that takes a value of type T and returns an object containing the name and the value.
 * @example
 * const createNumberTest = createTestCase<number>('test case 1');
 * const testCase = createNumberTest(42);
 * // Result: { name: 'test case 1', T: 42 }
 */
export const createTestCase =
  <T>(name: string) =>
  (value: T): TestCase<T> => ({
    name,
    T: value,
  });

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
