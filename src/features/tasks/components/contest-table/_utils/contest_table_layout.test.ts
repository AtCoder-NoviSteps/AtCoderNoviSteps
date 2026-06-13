import { describe, test, expect } from 'vitest';

import { getBodyRowClasses } from './contest_table_layout';

describe('getBodyRowClasses', () => {
  describe('default threshold (8)', () => {
    test('returns xl:table-row class when totalColumns equals threshold', () => {
      expect(getBodyRowClasses(8)).toBe('flex flex-wrap xl:table-row');
    });

    test('returns xl:table-row class when totalColumns is below threshold', () => {
      expect(getBodyRowClasses(7)).toBe('flex flex-wrap xl:table-row');
    });

    test('returns flex-wrap-only class when totalColumns exceeds threshold', () => {
      expect(getBodyRowClasses(9)).toBe('flex flex-wrap');
    });

    test('undefined wrapThreshold behaves the same as default 8', () => {
      expect(getBodyRowClasses(8, undefined)).toBe(getBodyRowClasses(8));
      expect(getBodyRowClasses(9, undefined)).toBe(getBodyRowClasses(9));
    });
  });

  describe('custom threshold (6)', () => {
    test('returns xl:table-row class when totalColumns equals threshold', () => {
      expect(getBodyRowClasses(6, 6)).toBe('flex flex-wrap xl:table-row');
    });

    test('returns flex-wrap-only class when totalColumns exceeds threshold', () => {
      expect(getBodyRowClasses(7, 6)).toBe('flex flex-wrap');
    });
  });
});
