import type { TaskGrade } from '$lib/types/task';

/** A single arc segment of the vote distribution donut chart. */
export type DonutSegment = {
  grade: TaskGrade;
  count: number;
  /** 0–100, one decimal place (e.g. 33.3) */
  percentage: number;
  /** CSS color string (e.g. "var(--color-atcoder-Q1)") */
  color: string;
  /** Display label (e.g. "1Q") */
  label: string;
  /** Radians, 0 = top of circle, clockwise */
  startAngle: number;
  /** Radians */
  endAngle: number;
  /** Midpoint angle for label placement */
  midAngle: number;
};

/** Ordered list of donut chart segment descriptors. */
export type DonutSegments = DonutSegment[];
