import path from 'path';
import fs from 'fs';

import { test } from 'vitest';

export interface TestCase<T> {
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
  if (!firstArray || !secondArray || !Array.isArray(firstArray) || !Array.isArray(secondArray)) {
    throw new Error('Both input arrays must be non-null and defined');
  }

  return firstArray
    .slice(0, Math.min(firstArray.length, secondArray.length))
    .map((item, i) => [item, secondArray[i]]);
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

/**
 * Loads mock data from a specified file path and parses it as JSON.
 *
 * @template T - The type to which the parsed JSON should be cast.
 * @param {string} filePath - The path to the file containing the mock data.
 * @returns {T} - The parsed mock data cast to the specified type.
 */
export const loadMockData = <T>(filePath: string): T => {
  const testDataPath = path.resolve(filePath);

  try {
    return JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as T;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Mock data file not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in mock data file: ${filePath}`);
      }
    }

    throw error;
  }
};
