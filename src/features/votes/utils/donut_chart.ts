const TAU = 2 * Math.PI;
const HALF_PI = Math.PI / 2;

/** Minimum percentage (0–1) threshold for a segment to receive an external label. */
export const MIN_LABEL_PCT = 0.05;

export type DonutSegment = {
  grade: string;
  count: number;
  /** 0–100, rounded */
  pct: number;
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

/**
 * Builds donut chart segment descriptors from vote counters.
 * Segments with count 0 are excluded.
 * @param grades - Ordered list of grade values to iterate over.
 * @param counters - Raw counter records from DB.
 * @param getColor - Maps grade to CSS color string.
 * @param getLabel - Maps grade to display string.
 */
export function buildDonutSegments(
  grades: string[],
  counters: { grade: string; count: number }[],
  getColor: (grade: string) => string,
  getLabel: (grade: string) => string,
): DonutSegment[] {
  const totalVotes = counters.reduce((sum, c) => sum + c.count, 0);
  if (totalVotes === 0) {
    return [];
  }

  const countMap = new Map(counters.map((c) => [c.grade, c.count]));
  let cumulative = 0;
  const segments: DonutSegment[] = [];

  for (const grade of grades) {
    const count = countMap.get(grade) ?? 0;
    if (count === 0) {
      continue;
    }

    const ratio = count / totalVotes;
    const startAngle = cumulative * TAU - HALF_PI;
    cumulative += ratio;
    const endAngle = cumulative * TAU - HALF_PI;

    segments.push({
      grade,
      count,
      pct: Math.round(ratio * 100),
      color: getColor(grade),
      label: getLabel(grade),
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
    });
  }

  return segments;
}

/**
 * Generates SVG path data for one donut arc segment.
 * @param cx - Center x coordinate.
 * @param cy - Center y coordinate.
 * @param outerRadius - Outer ring radius.
 * @param innerRadius - Inner hole radius.
 * @param startAngle - Radians, clockwise from top.
 * @param endAngle - Radians, clockwise from top.
 * @returns SVG path `d` attribute string.
 */
export function arcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + outerRadius * Math.cos(startAngle);
  const y1 = cy + outerRadius * Math.sin(startAngle);
  const x2 = cx + outerRadius * Math.cos(endAngle);
  const y2 = cy + outerRadius * Math.sin(endAngle);
  const x3 = cx + innerRadius * Math.cos(endAngle);
  const y3 = cy + innerRadius * Math.sin(endAngle);
  const x4 = cx + innerRadius * Math.cos(startAngle);
  const y4 = cy + innerRadius * Math.sin(startAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}
