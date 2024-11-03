import { describe, it, expect } from 'vitest';
import { createTestCase, runTestCases, runTests, zip } from './test_helpers';
import * as TestCasesForRunTestCases from './test_cases/test_helpers';

describe('createTestCase', () => {
  it('expects to be created a test case object with the given name and value', () => {
    const name = 'the most simple test case with one argument';
    const value = 42;
    const testCase = createTestCase<number>(name)(value);

    expect(testCase).toEqual({ name, value });
  });
});

describe('runTestCases', () => {
  it('expects to run a series of test cases with the provided test function', () => {
    runTestCases(
      'test cases for addition',
      TestCasesForRunTestCases.numerics,
      (testCase: { a: number; b: number; expected: number }) => {
        expect(testCase.a + testCase.b).toBe(testCase.expected);
      },
    );
  });

  it('expects to run test cases with different types of values', () => {
    runTestCases(
      'test cases with different types of values',
      TestCasesForRunTestCases.differentTypes,
      (testCase: {
        a: string | boolean | number[] | object;
        b: string | boolean | number[] | object;
        expected: string | boolean | number[] | object;
      }) => {
        if (testCase.a == null || testCase.b == null) {
          throw new Error('Test case values must be non-null and defined');
        } else if (typeof testCase.a === 'string' && typeof testCase.b === 'string') {
          expect(testCase.a + testCase.b).toBe(testCase.expected);
        } else if (typeof testCase.a === 'boolean' && typeof testCase.b === 'boolean') {
          expect(testCase.a && testCase.b).toBe(testCase.expected);
        } else if (Array.isArray(testCase.a) && Array.isArray(testCase.b)) {
          expect([...testCase.a, ...testCase.b]).toEqual(testCase.expected);
        } else if (typeof testCase.a === 'object' && typeof testCase.b === 'object') {
          expect({ ...testCase.a, ...testCase.b }).toEqual(testCase.expected);
        } else {
          throw new Error('Unsupported test case types');
        }
      },
    );
  });

  it('expects to throw an error if description is empty', () => {
    expect(() => {
      runTestCases('', [], () => {});
    }).toThrow('Description must be a non-empty string');
  });

  it('expects to throw an error if test cases array is empty', () => {
    expect(() => {
      runTestCases('empty test cases', [], () => {});
    }).toThrow('Test cases array must be non-empty');
  });

  it('expects to throw an error if test function is not provided', () => {
    expect(() => {
      runTestCases(
        'missing test function',
        [{ name: 'test', value: 1 }],
        null as unknown as () => void,
      );
    }).toThrow('Test function must be provided');
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

    let executedTests = 0;

    runTests(testName, testCases, (testCase: { input: number; expected: number }) => {
      expect(testCase.input * 2).toBe(testCase.expected);

      executedTests++;

      if (executedTests === testCases.length) {
        expect(executedTests).toBe(testCases.length);
      }
    });
  });

  it('expects to be handled empty test cases array', () => {
    const testName = 'empty test cases';

    runTests(testName, [], () => {
      throw new Error('Expect not to be called');
    });
  });
});

describe('zip', () => {
  it('expects to zip two arrays of equal length', () => {
    const firstArray = [1, 2, 3];
    const secondArray = ['a', 'b', 'c'];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ]);
  });

  it('expects to zip two arrays of different lengths', () => {
    const firstArray = [1, 2];
    const secondArray = ['a', 'b', 'c'];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('expects to zip two empty arrays', () => {
    const firstArray: number[] = [];
    const secondArray: string[] = [];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([]);
  });

  it('expects to zip when first array is longer', () => {
    const firstArray = [1, 2, 3];
    const secondArray = ['a'];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([[1, 'a']]);
  });

  it('expects to zip when first array is longer and second array is empty', () => {
    const firstArray = [1, 2, 3];
    const secondArray = [] as string[];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([]);
  });

  it('expects to zip when second array is longer', () => {
    const firstArray = [1];
    const secondArray = ['a', 'b', 'c'];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([[1, 'a']]);
  });

  it('expects to zip when second array is longer and first array is empty', () => {
    const firstArray = [] as number[];
    const secondArray = ['a', 'b', 'c'];
    const result = zip(firstArray, secondArray);

    expect(result).toEqual([]);
  });

  it('expects to handle large arrays efficiently', () => {
    const size = 100000;
    const firstArray = Array.from({ length: size }, (_, i) => i);
    const secondArray = Array.from({ length: size }, (_, i) => `item${i}`);

    // Warm-up run
    zip(firstArray, secondArray);

    // Multiple iterations for more reliable timing
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = zip(firstArray, secondArray);
      const endTime = performance.now();
      times.push(endTime - startTime);

      expect(result.length).toBe(size);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    expect(avgTime).toBeLessThan(50); // Should complete within 50ms for CI
  });

  it('expects to throw an error when the first array is null', () => {
    const firstArray = null as unknown as number[];
    const secondArray = ['a', 'b', 'c'];

    expect(() => zip(firstArray, secondArray)).toThrow('First array must be non-null and defined');
  });

  it('expects to throw an error when the second array is null', () => {
    const firstArray = ['a', 'b', 'c'];
    const secondArray = null as unknown as number[];

    expect(() => zip(firstArray, secondArray)).toThrow('Second array must be non-null and defined');
  });

  it('expects to throw an error when the first and second array are null', () => {
    const firstArray = null as unknown as number[];
    const secondArray = null as unknown as number[];

    expect(() => zip(firstArray, secondArray)).toThrow('First array must be non-null and defined');
  });

  it('expects to throw an error when the first array is not an array', () => {
    const firstArray = 'not an array' as unknown as string[];
    const secondArray = ['a', 'b', 'c'];

    expect(() => zip(firstArray, secondArray)).toThrow(
      'Both input arrays must be non-null and defined',
    );
  });

  it('expects to throw an error when the second array is not an array', () => {
    const firstArray = [1, 2, 3];
    const secondArray = 'not an array' as unknown as string[];

    expect(() => zip(firstArray, secondArray)).toThrow(
      'Both input arrays must be non-null and defined',
    );
  });
});
