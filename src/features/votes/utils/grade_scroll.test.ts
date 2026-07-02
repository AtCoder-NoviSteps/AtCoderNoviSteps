import { describe, it, expect } from 'vitest';
import { calcCenteredScrollTop } from './grade_scroll';

describe('calcCenteredScrollTop', () => {
  it('returns 0 when itemCount is 0', () => {
    expect(calcCenteredScrollTop(0, 200, 0, 50)).toBe(0);
  });

  it('returns 0 when scrollHeight is 0 (container hidden)', () => {
    expect(calcCenteredScrollTop(5, 0, 10, 50)).toBe(0);
  });

  it('clamps to 0 when target is near the top', () => {
    // itemHeight = 200/10 = 20, scrollTop = 0*20 - 50/2 + 20/2 = -15 → 0
    expect(calcCenteredScrollTop(0, 200, 10, 50)).toBe(0);
  });

  it('centers item in the middle of the list', () => {
    // itemHeight = 200/10 = 20, scrollTop = 5*20 - 50/2 + 20/2 = 100 - 25 + 10 = 85
    expect(calcCenteredScrollTop(5, 200, 10, 50)).toBe(85);
  });

  it('handles item at the last index', () => {
    // itemHeight=20, centered=9*20-25+10=165, maxScrollTop=200-50=150 → clamped to 150
    expect(calcCenteredScrollTop(9, 200, 10, 50)).toBe(150);
  });

  it('clamps to maxScrollTop when target is near the bottom', () => {
    // itemHeight=20, centered=8*20-25+10=145, maxScrollTop=200-50=150 → no clamp
    expect(calcCenteredScrollTop(8, 200, 10, 50)).toBe(145);
  });
});
