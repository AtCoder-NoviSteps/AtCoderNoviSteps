import { describe, test, expect, beforeEach, afterEach } from 'vitest';

import {
  buildAojIcpcLetterMap,
  formatAojIcpcTitle,
  ICPC_PRELIM_LABEL_OVERRIDES,
} from './aoj_icpc_labels';

describe('formatAojIcpcTitle', () => {
  test('prepends the letter and a dot to the title', () => {
    expect(formatAojIcpcTitle('Amidakuji', 'B')).toBe('B. Amidakuji');
  });
});

describe('buildAojIcpcLetterMap', () => {
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
      ICPC_PRELIM_LABEL_OVERRIDES['ICPCPrelimTest'] = {
        '1150': 'A',
        '1152': 'C',
        '1155': 'E',
      };
    });

    afterEach(() => {
      delete ICPC_PRELIM_LABEL_OVERRIDES['ICPCPrelimTest'];
    });

    test('uses override map when contest_id has an entry in ICPC_PRELIM_LABEL_OVERRIDES', () => {
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
