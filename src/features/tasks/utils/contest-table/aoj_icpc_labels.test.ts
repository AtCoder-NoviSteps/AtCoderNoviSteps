import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import { buildAojIcpcLetterMap, formatAojIcpcTitle, ICPC_LABEL_OVERRIDES } from './aoj_icpc_labels';

describe('formatAojIcpcTitle', () => {
  test('prepends the letter and a dot to the title (Prelim)', () => {
    expect(formatAojIcpcTitle('Amidakuji', 'B')).toBe('B. Amidakuji');
  });

  test('prepends the letter and a dot to the title (Regional)', () => {
    expect(formatAojIcpcTitle('Yokohama Phenomena', 'A')).toBe('A. Yokohama Phenomena');
  });
});

describe('buildAojIcpcLetterMap', () => {
  describe('Prelim', () => {
    test('sorts indices numerically ascending and assigns letters A, B, C...', () => {
      const result = buildAojIcpcLetterMap('ICPCPrelim2023', ['1665', '1664']);

      expect(result.get('1664')).toBe('A');
      expect(result.get('1665')).toBe('B');
      expect(result.size).toBe(2);
    });

    test('returns empty Map for empty input', () => {
      const result = buildAojIcpcLetterMap('ICPCPrelim2023', []);

      expect(result.size).toBe(0);
    });

    test('returns Map with single entry assigned letter A', () => {
      const result = buildAojIcpcLetterMap('ICPCPrelim2023', ['1000']);

      expect(result.get('1000')).toBe('A');
      expect(result.size).toBe(1);
    });

    describe('override path', () => {
      beforeEach(() => {
        ICPC_LABEL_OVERRIDES['ICPCPrelimTest'] = {
          '1150': 'A',
          '1152': 'C',
          '1155': 'E',
        };
      });

      afterEach(() => {
        delete ICPC_LABEL_OVERRIDES['ICPCPrelimTest'];
      });

      test('uses override map when contest_id has an entry in ICPC_LABEL_OVERRIDES', () => {
        const result = buildAojIcpcLetterMap('ICPCPrelimTest', ['1150', '1152', '1155']);

        expect(result.get('1150')).toBe('A');
        expect(result.get('1152')).toBe('C');
        expect(result.get('1155')).toBe('E');
        expect(result.size).toBe(3);
      });

      test('ignores the input indices and uses only the override map entries', () => {
        const result = buildAojIcpcLetterMap('ICPCPrelimTest', ['1150', '1152', '1155']);

        expect(result.has('1151')).toBe(false);
        expect(result.has('1153')).toBe(false);
      });
    });
  });

  describe('Regional', () => {
    test('sorts indices numerically ascending and assigns letters A, B, C...', () => {
      const result = buildAojIcpcLetterMap('ICPCRegional2023', ['1445', '1444']);

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
      const result = buildAojIcpcLetterMap('ICPCRegional2024', indices);

      expect(result.get('1455')).toBe('A');
      expect(result.get('1466')).toBe('L');
      expect(result.size).toBe(12);
    });

    test('returns empty Map for empty input', () => {
      const result = buildAojIcpcLetterMap('ICPCRegional2023', []);

      expect(result.size).toBe(0);
    });

    test('returns Map with single entry assigned letter A', () => {
      const result = buildAojIcpcLetterMap('ICPCRegional2023', ['1444']);

      expect(result.get('1444')).toBe('A');
      expect(result.size).toBe(1);
    });

    describe('override path', () => {
      beforeEach(() => {
        ICPC_LABEL_OVERRIDES['ICPCRegionalTest'] = {
          '1444': 'A',
          '1446': 'C',
          '1448': 'E',
        };
      });

      afterEach(() => {
        delete ICPC_LABEL_OVERRIDES['ICPCRegionalTest'];
      });

      test('uses override map when contest_id has an entry in ICPC_LABEL_OVERRIDES', () => {
        const result = buildAojIcpcLetterMap('ICPCRegionalTest', ['1444', '1446', '1448']);

        expect(result.get('1444')).toBe('A');
        expect(result.get('1446')).toBe('C');
        expect(result.get('1448')).toBe('E');
        expect(result.size).toBe(3);
      });

      test('ignores the input indices and uses only the override map entries', () => {
        const result = buildAojIcpcLetterMap('ICPCRegionalTest', ['1444', '1446', '1448']);

        expect(result.has('1445')).toBe(false);
        expect(result.has('1447')).toBe(false);
      });
    });
  });
});
