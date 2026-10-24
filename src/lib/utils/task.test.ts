import { describe, test, expect } from 'vitest';

import { removeTaskIndexFromTitle, buildTitleWithTaskIndex } from '#lib/utils/task.js';

describe('removeTaskIndexFromTitle', () => {
  describe('successful cases', () => {
    test('removes the task index prefix at the start of the title', () => {
      expect(removeTaskIndexFromTitle('A. Jiro', 'A')).toBe('Jiro');
    });
  });

  describe('edge cases', () => {
    test('keeps "<index>. " that appears inside the title', () => {
      expect(removeTaskIndexFromTitle('Plan B. Escape', 'B')).toBe('Plan B. Escape');
    });

    test('keeps ". " inside the title when no task index is given', () => {
      expect(removeTaskIndexFromTitle('Dr. Podboq or: How We Became Asymmetric')).toBe(
        'Dr. Podboq or: How We Became Asymmetric',
      );
    });
  });
});

describe('buildTitleWithTaskIndex', () => {
  describe('when the title already starts with the task index (AtCoder)', () => {
    test.each([
      { title: 'A. Jiro', taskTableIndex: 'A', expected: 'A. Jiro' },
      { title: 'EX10. 1.10', taskTableIndex: 'EX10', expected: 'EX10. 1.10' },
      {
        title: '001. Yokan Party（★4）',
        taskTableIndex: '001',
        expected: '001. Yokan Party（★4）',
      },
    ])('keeps "$expected" without a duplicated prefix', ({ title, taskTableIndex, expected }) => {
      expect(buildTitleWithTaskIndex(title, taskTableIndex)).toBe(expected);
    });
  });

  describe('when the title has no task index (AOJ ICPC / JAG Prelim)', () => {
    test.each([
      { title: 'Snacks within 300 Yen', taskTableIndex: 'A', expected: 'A. Snacks within 300 Yen' },
      { title: 'Billiards', taskTableIndex: 'F', expected: 'F. Billiards' },
      { title: 'Peculiar Protocol', taskTableIndex: 'L', expected: 'L. Peculiar Protocol' },
    ])('prefixes the task index to build "$expected"', ({ title, taskTableIndex, expected }) => {
      expect(buildTitleWithTaskIndex(title, taskTableIndex)).toBe(expected);
    });

    test('keeps "<index>. " that appears inside the title', () => {
      expect(buildTitleWithTaskIndex('Plan B. Escape', 'B')).toBe('B. Plan B. Escape');
    });
  });
});
