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
    first: [],
    second: [],
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
    second: [] as string[],
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
    first: [] as number[],
    second: ['a', 'b', 'c'],
    expected: [],
  },
];
