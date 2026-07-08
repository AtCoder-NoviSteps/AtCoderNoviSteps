import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import type { TaskResults } from '$lib/types/task';

import {
  buildAojLetterMap,
  buildAojDisplayConfig,
  formatAojTitle,
  sortAojHeaderIds,
  AOJ_LABEL_OVERRIDES,
} from './aoj_labels';

describe('formatAojTitle', () => {
  test('prepends the letter and a dot to the title (Prelim)', () => {
    expect(formatAojTitle('Amidakuji', 'B')).toBe('B. Amidakuji');
  });

  test('prepends the letter and a dot to the title (Regional)', () => {
    expect(formatAojTitle('Yokohama Phenomena', 'A')).toBe('A. Yokohama Phenomena');
  });
});

describe('buildAojLetterMap', () => {
  describe('Prelim', () => {
    test('sorts indices numerically ascending and assigns letters A, B, C...', () => {
      const result = buildAojLetterMap('ICPCPrelim2023', ['1665', '1664']);

      expect(result.get('1664')).toBe('A');
      expect(result.get('1665')).toBe('B');
      expect(result.size).toBe(2);
    });

    test('returns empty Map for empty input', () => {
      const result = buildAojLetterMap('ICPCPrelim2023', []);

      expect(result.size).toBe(0);
    });

    test('returns Map with single entry assigned letter A', () => {
      const result = buildAojLetterMap('ICPCPrelim2023', ['1000']);

      expect(result.get('1000')).toBe('A');
      expect(result.size).toBe(1);
    });

    describe('override path', () => {
      beforeEach(() => {
        AOJ_LABEL_OVERRIDES['ICPCPrelimTest'] = {
          '1150': 'A',
          '1152': 'C',
          '1155': 'E',
        };
      });

      afterEach(() => {
        delete AOJ_LABEL_OVERRIDES['ICPCPrelimTest'];
      });

      test('uses override map when contest_id has an entry in AOJ_LABEL_OVERRIDES', () => {
        const result = buildAojLetterMap('ICPCPrelimTest', ['1150', '1152', '1155']);

        expect(result.get('1150')).toBe('A');
        expect(result.get('1152')).toBe('C');
        expect(result.get('1155')).toBe('E');
        expect(result.size).toBe(3);
      });

      test('ignores the input indices and uses only the override map entries', () => {
        const result = buildAojLetterMap('ICPCPrelimTest', ['1150', '1152', '1155']);

        expect(result.has('1151')).toBe(false);
        expect(result.has('1153')).toBe(false);
      });
    });
  });

  describe('Regional', () => {
    test('sorts indices numerically ascending and assigns letters A, B, C...', () => {
      const result = buildAojLetterMap('ICPCRegional2023', ['1445', '1444']);

      expect(result.get('1444')).toBe('A');
      expect(result.get('1445')).toBe('B');
      expect(result.size).toBe(2);
    });

    test('assigns letters A through L for the 12 problems of 2024', () => {
      const indices = [
        '1455',
        '1456',
        '1457',
        '1458',
        '1459',
        '1460',
        '1461',
        '1462',
        '1463',
        '1464',
        '1465',
        '1466',
      ];
      const result = buildAojLetterMap('ICPCRegional2024', indices);

      expect(result.get('1455')).toBe('A');
      expect(result.get('1466')).toBe('L');
      expect(result.size).toBe(12);
    });

    test('returns empty Map for empty input', () => {
      const result = buildAojLetterMap('ICPCRegional2023', []);

      expect(result.size).toBe(0);
    });

    test('returns Map with single entry assigned letter A', () => {
      const result = buildAojLetterMap('ICPCRegional2023', ['1444']);

      expect(result.get('1444')).toBe('A');
      expect(result.size).toBe(1);
    });

    describe('override path', () => {
      beforeEach(() => {
        AOJ_LABEL_OVERRIDES['ICPCRegionalTest'] = {
          '1444': 'A',
          '1446': 'C',
          '1448': 'E',
        };
      });

      afterEach(() => {
        delete AOJ_LABEL_OVERRIDES['ICPCRegionalTest'];
      });

      test('uses override map when contest_id has an entry in AOJ_LABEL_OVERRIDES', () => {
        const result = buildAojLetterMap('ICPCRegionalTest', ['1444', '1446', '1448']);

        expect(result.get('1444')).toBe('A');
        expect(result.get('1446')).toBe('C');
        expect(result.get('1448')).toBe('E');
        expect(result.size).toBe(3);
      });

      test('ignores the input indices and uses only the override map entries', () => {
        const result = buildAojLetterMap('ICPCRegionalTest', ['1444', '1446', '1448']);

        expect(result.has('1445')).toBe(false);
        expect(result.has('1447')).toBe(false);
      });
    });
  });
});

describe('sortAojHeaderIds', () => {
  test('returns unique task_table_index values sorted numerically ascending', () => {
    const filtered = [
      { task_table_index: '1666' },
      { task_table_index: '1664' },
      { task_table_index: '1665' },
    ] as TaskResults;

    expect(sortAojHeaderIds(filtered)).toEqual(['1664', '1665', '1666']);
  });

  test('deduplicates repeated task_table_index values', () => {
    const filtered = [{ task_table_index: '1664' }, { task_table_index: '1664' }] as TaskResults;

    expect(sortAojHeaderIds(filtered)).toEqual(['1664']);
  });

  test('returns empty array for empty input', () => {
    expect(sortAojHeaderIds([] as TaskResults)).toEqual([]);
  });
});

describe('buildAojDisplayConfig', () => {
  test('returns the shared AOJ display config', () => {
    const config = buildAojDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.isShownTaskIndex).toBe(true);
    expect(config.roundLabelWidth).toBe('');
    expect(config.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2');
    expect(config.columnWrapThreshold).toBe(6);
  });
});
