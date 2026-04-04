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

type Point = { x: number; y: number };

/**
 * Generates SVG path data for one donut arc segment.
 * When the span covers a full circle, the path is split into two semicircular
 * arcs to avoid the SVG arc command degeneracy (start == end coordinates).
 * @param center - Center coordinates of the donut chart.
 * @param outerRadius - Outer ring radius.
 * @param innerRadius - Inner hole radius.
 * @param startAngle - Radians, clockwise from top.
 * @param endAngle - Radians, clockwise from top.
 * @returns SVG path `d` attribute string.
 */
export function arcPath(
  center: Point,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 2 * Math.PI - 1e-9) {
    const midAngle = startAngle + Math.PI;
    return [
      arcPathSegment(center, outerRadius, innerRadius, startAngle, midAngle),
      arcPathSegment(center, outerRadius, innerRadius, midAngle, endAngle),
    ].join(' ');
  }
  return arcPathSegment(center, outerRadius, innerRadius, startAngle, endAngle);
}

function arcPathSegment(
  center: Point,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart: Point = {
    x: center.x + outerRadius * Math.cos(startAngle),
    y: center.y + outerRadius * Math.sin(startAngle),
  };
  const outerEnd: Point = {
    x: center.x + outerRadius * Math.cos(endAngle),
    y: center.y + outerRadius * Math.sin(endAngle),
  };
  const innerEnd: Point = {
    x: center.x + innerRadius * Math.cos(endAngle),
    y: center.y + innerRadius * Math.sin(endAngle),
  };
  const innerStart: Point = {
    x: center.x + innerRadius * Math.cos(startAngle),
    y: center.y + innerRadius * Math.sin(startAngle),
  };
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // SVG path commands per spec: M=moveto, A=arc, L=lineto, Z=closepath
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}
