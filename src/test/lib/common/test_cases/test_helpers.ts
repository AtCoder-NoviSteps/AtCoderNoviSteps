export interface TestCaseForRunTestCases<T, R> {
  name: string;
  value: {
    a: T;
    b: T;
    expected: R;
  };
}

export const numerics = [
  { name: 'add 1 + 1', value: { a: 1, b: 1, expected: 2 } },
  { name: 'add 2 + 2', value: { a: 2, b: 2, expected: 4 } },
  { name: 'add 3 + 3', value: { a: 3, b: 3, expected: 6 } },
  { name: 'add -1 + 2', value: { a: -1, b: 2, expected: 1 } },
  { name: 'add 100000000 + 100000001', value: { a: 100000000, b: 100000001, expected: 200000001 } },
];

export const empty: Array<TestCaseForRunTestCases<number, number>> = [];

export const differentTypes = [
  { name: 'string concatenation', value: { a: 'Hello, ', b: 'world!', expected: 'Hello, world!' } },
  { name: 'boolean AND operation', value: { a: true, b: false, expected: false } },
];
