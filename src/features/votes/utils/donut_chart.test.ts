import { describe, test, expect } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import { buildDonutSegments, buildArcPath, calcPointOnCircle, MIN_LABEL_PCT } from './donut_chart';

const GRADE_A = TaskGrade.Q1;
const GRADE_B = TaskGrade.Q2;
const COLOR_A = 'var(--color-atcoder-Q1)';

const getColor = (grade: TaskGrade) => `var(--color-atcoder-${grade})`;
const getLabel = (grade: TaskGrade) => `${grade.slice(1)}${grade.slice(0, 1)}`; // Q1 -> 1Q

describe('buildDonutSegments', () => {
  test('returns empty array when totalVotes is 0', () => {
    const result = buildDonutSegments([GRADE_A], [], getColor, getLabel);
    expect(result).toEqual([]);
  });

  test('excludes grades with count 0', () => {
    const counters = [{ grade: GRADE_A, count: 0 }];
    const result = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(result).toHaveLength(0);
  });

  test('builds a single segment covering the full circle', () => {
    const counters = [{ grade: GRADE_A, count: 10 }];
    const [segment] = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(segment.percentage).toBe(100);
    expect(segment.count).toBe(10);
    expect(segment.color).toBe(COLOR_A);
    expect(segment.label).toBe(getLabel(GRADE_A));
    // full circle: endAngle - startAngle ≈ 2π
    expect(segment.endAngle - segment.startAngle).toBeCloseTo(2 * Math.PI);
  });

  test('builds two segments with correct proportions', () => {
    const counters = [
      { grade: GRADE_A, count: 1 },
      { grade: GRADE_B, count: 3 },
    ];
    const segments = buildDonutSegments([GRADE_A, GRADE_B], counters, getColor, getLabel);
    expect(segments).toHaveLength(2);
    expect(segments[0].percentage).toBe(25);
    expect(segments[1].percentage).toBe(75);
    // Segments are contiguous: second starts where first ends
    expect(segments[1].startAngle).toBeCloseTo(segments[0].endAngle);
  });

  test('starts at the top of the circle (−π/2)', () => {
    const counters = [{ grade: GRADE_A, count: 5 }];
    const [segment] = buildDonutSegments([GRADE_A], counters, getColor, getLabel);
    expect(segment.startAngle).toBeCloseTo(-Math.PI / 2);
  });
});

describe('calcPointOnCircle', () => {
  test('returns center when radius is 0', () => {
    const point = calcPointOnCircle({ x: 10, y: 20 }, 0, 0);
    expect(point.x).toBeCloseTo(10);
    expect(point.y).toBeCloseTo(20);
  });

  test('returns top of circle at angle -π/2', () => {
    const point = calcPointOnCircle({ x: 0, y: 0 }, 100, -Math.PI / 2);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(-100);
  });

  test('returns right of circle at angle 0', () => {
    const point = calcPointOnCircle({ x: 0, y: 0 }, 100, 0);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(0);
  });
});

describe('buildArcPath', () => {
  test('returns a string containing M and A and Z commands', () => {
    const path = buildArcPath({ x: 100, y: 100 }, 70, 40, 0, Math.PI);
    expect(path).toMatch(/^M /);
    expect(path).toContain(' A ');
    expect(path).toContain(' Z');
  });

  test('uses large-arc-flag=1 when angle span exceeds π', () => {
    const path = buildArcPath({ x: 100, y: 100 }, 70, 40, 0, Math.PI + 0.1);
    // large-arc-flag appears as the 4th param of the A command
    expect(path).toMatch(/A \d+ \d+ 0 1 1/);
  });

  test('uses large-arc-flag=0 when angle span is less than π', () => {
    const path = buildArcPath({ x: 100, y: 100 }, 70, 40, 0, Math.PI - 0.1);
    expect(path).toMatch(/A \d+ \d+ 0 0 1/);
  });
});

describe('buildArcPath - full circle', () => {
  test('renders full-circle segment as two sub-paths to avoid degenerate arc', () => {
    const start = -Math.PI / 2;
    const end = start + 2 * Math.PI;
    const path = buildArcPath({ x: 100, y: 100 }, 70, 40, start, end);
    // Two M commands indicate two sub-paths (dual-arc workaround)
    const subPathCount = (path.match(/\bM\b/g) ?? []).length;
    expect(subPathCount).toBe(2);
  });
});

describe('MIN_LABEL_PCT', () => {
  test('is 0.05', () => {
    expect(MIN_LABEL_PCT).toBe(0.05);
  });
});
