import { describe, it, expect } from 'vitest';
import { buildDonutSegments, arcPath, MIN_LABEL_PCT } from './donut_chart';

const GRADE_A = 'Q1';
const GRADE_B = 'Q2';
const COLOR_A = 'var(--color-atcoder-Q1)';

const getColor = (g: string) => `var(--color-atcoder-${g})`;
const getLabel = (g: string) => `${g.slice(1)}${g.slice(0, 1)}`; // Q1 -> 1Q

describe('buildDonutSegments', () => {
  it('returns empty array when totalVotes is 0', () => {
    const result = buildDonutSegments([GRADE_A], [], getColor, getLabel);
    expect(result).toEqual([]);
  });

  it('excludes grades with count 0', () => {
    const counters = [{ grade: GRADE_A, count: 0 }];
    const result = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(result).toHaveLength(0);
  });

  it('builds a single segment covering the full circle', () => {
    const counters = [{ grade: GRADE_A, count: 10 }];
    const [seg] = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(seg.pct).toBe(100);
    expect(seg.count).toBe(10);
    expect(seg.color).toBe(COLOR_A);
    expect(seg.label).toBe('1Q');
    // full circle: endAngle - startAngle ≈ 2π
    expect(seg.endAngle - seg.startAngle).toBeCloseTo(2 * Math.PI);
  });

  it('builds two segments with correct proportions', () => {
    const counters = [
      { grade: GRADE_A, count: 1 },
      { grade: GRADE_B, count: 3 },
    ];
    const segs = buildDonutSegments([GRADE_A, GRADE_B], counters, getColor, getLabel);
    expect(segs).toHaveLength(2);
    expect(segs[0].pct).toBe(25);
    expect(segs[1].pct).toBe(75);
    // Segments are contiguous: second starts where first ends
    expect(segs[1].startAngle).toBeCloseTo(segs[0].endAngle);
  });

  it('starts at the top of the circle (−π/2)', () => {
    const counters = [{ grade: GRADE_A, count: 5 }];
    const [seg] = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(seg.startAngle).toBeCloseTo(-Math.PI / 2);
  });
});

describe('arcPath', () => {
  it('returns a string containing M and A and Z commands', () => {
    const path = arcPath(100, 100, 70, 40, 0, Math.PI);
    expect(path).toMatch(/^M /);
    expect(path).toContain(' A ');
    expect(path).toContain(' Z');
  });

  it('uses large-arc-flag=1 when angle span exceeds π', () => {
    const path = arcPath(100, 100, 70, 40, 0, Math.PI + 0.1);
    // large-arc-flag appears as the 4th param of the A command
    expect(path).toMatch(/A \d+ \d+ 0 1 1/);
  });

  it('uses large-arc-flag=0 when angle span is less than π', () => {
    const path = arcPath(100, 100, 70, 40, 0, Math.PI - 0.1);
    expect(path).toMatch(/A \d+ \d+ 0 0 1/);
  });
});

describe('MIN_LABEL_PCT', () => {
  it('is 0.05', () => {
    expect(MIN_LABEL_PCT).toBe(0.05);
  });
});
