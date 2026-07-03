import { describe, test, expect } from 'vitest';
import { calcCenteredScrollTop } from './grade_scroll_position';

describe('calcCenteredScrollTop', () => {
  describe('normal cases', () => {
    test('centers item in the middle of the list', () => {
      // itemHeight = 200/10 = 20, scrollTop = 5*20 - 50/2 + 20/2 = 100 - 25 + 10 = 85
      expect(calcCenteredScrollTop(10, 5, 200, 50)).toBe(85);
    });

    test('clamps to maxScrollTop when target is near the bottom', () => {
      // itemHeight=20, centered=8*20-25+10=145, maxScrollTop=200-50=150 → no clamp
      expect(calcCenteredScrollTop(10, 8, 200, 50)).toBe(145);
    });
  });

  describe('edge cases', () => {
    test('clamps to 0 when target is near the top', () => {
      // itemHeight = 200/10 = 20, scrollTop = 0*20 - 50/2 + 20/2 = -15 → 0
      expect(calcCenteredScrollTop(10, 0, 200, 50)).toBe(0);
    });

    test('clamps to maxScrollTop when target is at the last index', () => {
      // itemHeight=20, centered=9*20-25+10=165, maxScrollTop=200-50=150 → clamped to 150
      expect(calcCenteredScrollTop(10, 9, 200, 50)).toBe(150);
    });
  });

  describe('invalid input', () => {
    test('returns 0 when itemCount is 0', () => {
      expect(calcCenteredScrollTop(0, 0, 200, 50)).toBe(0);
    });

    test('returns 0 when scrollHeight is 0 (container hidden)', () => {
      expect(calcCenteredScrollTop(10, 5, 0, 50)).toBe(0);
    });
  });
});
