import { test } from 'vitest';

interface TestCase<T> {
  name: string;
  value: T;
}

/**
 * Creates a test case object with a given name and value.
 *
 * @template T - The type of the value to be included in the test case.
 * @param {string} name - The name of the test case.
 * @returns {(value: T) => { name: string; value: T }} - A function that takes a value of type T and returns an object containing the name and the value.
 * @example
 * const createNumberTest = createTestCase<number>('test case 1');
 * const testCase = createNumberTest(42);
 * // Result: { name: 'test case 1', value: 42 }
 */
export const createTestCase =
  <T>(name: string) =>
  (value: T): TestCase<T> => ({
    name,
    value,
  });

/**
 * Combines two arrays into an array of tuples. Each tuple contains one element from each of the input arrays.
 * The resulting array will have a length equal to the shorter of the two input arrays.
 *
 * @template T - The type of elements in the first array.
 * @template U - The type of elements in the second array.
 * @param {T[]} firstArray - The first array to zip.
 * @param {U[]} secondArray - The second array to zip.
 * @returns {[T, U][]} An array of tuples, where each tuple contains one element from each of the input arrays.
 * @example
 * const numbers = [1, 2, 3];
 * const letters = ['a', 'b', 'c'];
 * const result = zip(numbers, letters); // [[1, 'a'], [2, 'b'], [3, 'c']]
 *
 * // With arrays of different lengths
 * const short = [1, 2];
 * const long = ['a', 'b', 'c'];
 * const result = zip(short, long); // [[1, 'a'], [2, 'b']]
 */
export function zip<T, U>(firstArray: T[], secondArray: U[]): [T, U][] {
  if (!firstArray || !secondArray) {
    throw new Error('Both arrays must be non-null');
  }

  return firstArray
    .slice(0, Math.min(firstArray.length, secondArray.length))
    .map((item, i) => [item, secondArray[i]]);
}

/**
 * Runs a series of test cases using the provided test function.
 *
 * @template T - The type of the test case value.
 * @param {string} description - A description for the test suite.
 * @param {Array<{ name: string; value: T }>} testCases - An array of test cases, each containing a name and a value.
 * @param {(testCase: T) => void} testFunction - The function to execute for each test case.
 */
export function runTestCases<T>(
  description: string,
  testCases: Array<{ name: string; value: T }>,
  testFunction: (testCase: T) => void,
) {
  describe(description, () => {
    testCases.forEach(({ name, value }) => {
      runTests(`${name}`, [value], testFunction);
    });
  });
}

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
