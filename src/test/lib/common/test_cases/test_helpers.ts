/**
 * Interface for defining test cases with two inputs of the same type and an expected result.
 * @template T The type of input parameters
 * @template R The type of expected result
 */
export interface TestCaseForRunTestCases<T, R> {
  /** Descriptive name of the test case */
  name: string;
  value: {
    /** First input parameter */
    a: T;
    /** Second input parameter */
    b: T | T[];
    /** Expected result of the operation */
    expected: R;
  };
}

export const numerics = [
  { name: 'add 1 + 1', value: { a: 1, b: 1, expected: 2 } },
  { name: 'add 2 + 2', value: { a: 2, b: 2, expected: 4 } },
  { name: 'add 3 + 3', value: { a: 3, b: 3, expected: 6 } },
  { name: 'add -1 + 2', value: { a: -1, b: 2, expected: 1 } },
  { name: 'add 100000000 + 100000001', value: { a: 100000000, b: 100000001, expected: 200000001 } },
  { name: 'add with zero', value: { a: 0, b: 5, expected: 5 } },
  { name: 'add floating points', value: { a: 0.1, b: 0.2, expected: 0.3 } },
  {
    name: 'add near MAX_SAFE_INTEGER',
    value: { a: Number.MAX_SAFE_INTEGER - 1, b: 1, expected: Number.MAX_SAFE_INTEGER },
  },
];

// Empty array for testing edge cases or as a base case for test utilities.
export const empty: Array<TestCaseForRunTestCases<number, number>> = [];

export const differentTypes = [
  { name: 'string concatenation', value: { a: 'Hello, ', b: 'world!', expected: 'Hello, world!' } },
  { name: 'boolean AND operation', value: { a: true, b: false, expected: false } },
  { name: 'boolean OR operation', value: { a: false, b: true, expected: true } },
  { name: 'array concatenation', value: { a: [1, 2], b: [3, 4], expected: [1, 2, 3, 4] } },
  { name: 'object merge', value: { a: { x: 1 }, b: { y: 2 }, expected: { x: 1, y: 2 } } },
];
