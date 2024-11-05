/**
 * Interface representing a test case for the `zip` function.
 *
 * @template T - The type of elements in the first array.
 * @template U - The type of elements in the second array.
 */
interface TestCaseForZip<T, U> {
  /**
   * The name of the test case.
   */
  name: string;

  /**
   * The first array of elements to be zipped.
   */
  first: T[];

  /**
   * The second array of elements to be zipped.
   */
  second: U[];

  /**
   * The expected result of zipping the two arrays.
   * Each element in the result is a tuple containing one element from the first array and one element from the second array.
   */
  expected: [T, U][];
}

export const testCasesForZip: TestCaseForZip<number, string>[] = [
  {
    name: 'two arrays of equal length',
    first: [1, 2, 3],
    second: ['a', 'b', 'c'],
    expected: [
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ],
  },
  {
    name: 'two arrays of different length',
    first: [1, 2],
    second: ['a', 'b', 'c'],
    expected: [
      [1, 'a'],
      [2, 'b'],
    ],
  },
  {
    name: 'two empty arrays',
    first: Array<number>(),
    second: Array<string>(),
    expected: [],
  },
  {
    name: 'first array is longer',
    first: [1, 2, 3],
    second: ['a'],
    expected: [[1, 'a']],
  },
  {
    name: 'first array is longer and second array is empty',
    first: [1, 2, 3],
    second: Array<string>(),
    expected: [],
  },
  {
    name: 'second array is longer',
    first: [1],
    second: ['a', 'b', 'c'],
    expected: [[1, 'a']],
  },
  {
    name: 'second array is longer and first array is empty',
    first: Array<number>(),
    second: ['a', 'b', 'c'],
    expected: [],
  },
];

/**
 * Represents a test case for the zip function that is expected to produce an error.
 *
 * @interface ErrorTestCaseForZip
 * @property {string} name - The name of the test case.
 * @property {unknown} first - The first input value for the zip function (expected to throw if not an array).
 * @property {unknown} second - The second input value for the zip function (expected to throw if not an array).
 * @throws {TypeError} When inputs are not arrays
 */
interface ErrorTestCaseForZip {
  name: string;
  first: unknown;
  second: unknown;
}

export const errorTestCases: ErrorTestCaseForZip[] = [
  {
    name: 'first array is null',
    first: null,
    second: ['a', 'b', 'c'],
  },
  {
    name: 'second array is null',
    first: ['a', 'b', 'c'],
    second: null,
  },
  {
    name: 'both arrays are null',
    first: null,
    second: null,
  },
  {
    name: 'first array is not an array',
    first: 'not an array',
    second: ['a', 'b', 'c'],
  },
  {
    name: 'second array is not an array',
    first: ['a', 'b', 'c'],
    second: 'not an array',
  },
];
