import { describe, it, expect } from 'vitest';
import { createTestCase, runTestCases, runTests, zip } from './test_helpers';

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
    const description = 'test cases for addition';
    const testCases = [
      { name: 'add 1 + 1', value: { a: 1, b: 1, expected: 2 } },
      { name: 'add 2 + 2', value: { a: 2, b: 2, expected: 4 } },
      { name: 'add 3 + 3', value: { a: 3, b: 3, expected: 6 } },
    ];

    runTestCases(description, testCases, (testCase: { a: number; b: number; expected: number }) => {
      expect(testCase.a + testCase.b).toBe(testCase.expected);
    });
  });

  it('expects to handle an empty array of test cases', () => {
    const description = 'empty test cases';
    const testCases: Array<{ name: string; value: { a: number; b: number; expected: number } }> =
      [];

    runTestCases(description, testCases, () => {
      throw new Error('Expect not to be called');
    });
  });

  it('expects to run test cases with different types of values', () => {
    const description = 'test cases with different types';
    const testCases = [
      {
        name: 'string concatenation',
        value: { a: 'Hello, ', b: 'world!', expected: 'Hello, world!' },
      },
      { name: 'boolean AND operation', value: { a: true, b: false, expected: false } },
    ];

    runTestCases(
      description,
      testCases,
      (testCase: { a: string | boolean; b: string | boolean; expected: string | boolean }) => {
        if (typeof testCase.a === 'string' && typeof testCase.b === 'string') {
          expect(testCase.a + testCase.b).toBe(testCase.expected);
        } else if (typeof testCase.a === 'boolean' && typeof testCase.b === 'boolean') {
          expect(testCase.a && testCase.b).toBe(testCase.expected);
        }
      },
    );
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

    const startTime = performance.now();
    const result = zip(firstArray, secondArray);
    const endTime = performance.now();

    expect(result.length).toBe(size);
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
  });

  it('expects to throw an error when the first array is null', () => {
    const firstArray = null as unknown as number[];
    const secondArray = ['a', 'b', 'c'];

    expect(() => zip(firstArray, secondArray)).toThrow('Both arrays must be non-null');
  });

  it('expects to throw an error when the second array is null', () => {
    const firstArray = ['a', 'b', 'c'];
    const secondArray = null as unknown as number[];

    expect(() => zip(firstArray, secondArray)).toThrow('Both arrays must be non-null');
  });

  it('expects to throw an error when the first and second array are null', () => {
    const firstArray = null as unknown as number[];
    const secondArray = null as unknown as number[];

    expect(() => zip(firstArray, secondArray)).toThrow('Both arrays must be non-null');
  });
});
