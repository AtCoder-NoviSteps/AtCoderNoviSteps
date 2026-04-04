import { TaskGrade } from '$lib/types/task';
import type { DonutSegment, DonutSegments } from '$features/votes/types/donut_graph';

export type { DonutSegment, DonutSegments };

const TAU = 2 * Math.PI;
const HALF_PI = Math.PI / 2;

/** Minimum percentage (0–1) threshold for a segment to receive an external label. */
export const MIN_LABEL_PCT = 0.05;

/**
 * Builds donut chart segment descriptors from vote counters.
 * Segments with count 0 are excluded.
 * @param grades - Ordered list of grade values to iterate over.
 * @param counters - Raw counter records from DB.
 * @param getColor - Maps grade to CSS color string.
 * @param getLabel - Maps grade to display string.
 */
export function buildDonutSegments(
  grades: TaskGrade[],
  counters: { grade: TaskGrade; count: number }[],
  getColor: (grade: TaskGrade) => string,
  getLabel: (grade: TaskGrade) => string,
): DonutSegments {
  const totalVotes = counters.reduce((sum, counter) => sum + counter.count, 0);

  if (totalVotes === 0) {
    return [];
  }

  const countMap = new Map(counters.map((counter) => [counter.grade, counter.count]));
  let cumulative = 0;
  const segments: DonutSegments = [];

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
      percentage: Math.round(ratio * 1000) / 10,
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
 * Calculates the point on a circle at the given angle.
 * @param center - Center of the circle.
 * @param radius - Radius of the circle.
 * @param angle - Angle in radians.
 * @returns The Cartesian coordinates of the point.
 */
export function calcPointOnCircle(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

/**
 * Generates SVG path data for one donut arc segment.
 * When the span covers a full circle, the path is split into two semicircular
 * arcs to avoid the SVG arc command degeneracy (start == end coordinates).
 *
 * @param center - Center coordinates of the donut chart.
 * @param outerRadius - Outer ring radius.
 * @param innerRadius - Inner hole radius.
 * @param startAngle - Radians, clockwise from top.
 * @param endAngle - Radians, clockwise from top.
 *
 * @returns SVG path `d` attribute string.
 */
export function buildArcPath(
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
  const outerStart = calcPointOnCircle(center, outerRadius, startAngle);
  const outerEnd = calcPointOnCircle(center, outerRadius, endAngle);
  const innerEnd = calcPointOnCircle(center, innerRadius, endAngle);
  const innerStart = calcPointOnCircle(center, innerRadius, startAngle);
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
