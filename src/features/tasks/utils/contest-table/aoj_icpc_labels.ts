import type { TaskResults } from '$lib/types/task';
import type {
  ContestTableDisplayConfig,
  ContestTableTitleStyle,
} from '$features/tasks/types/contest-table/contest_table_provider';

// contest_id -> (task_table_index -> letter). Used only for years with judge gaps.
// Keyed by full contest_id so both Prelim and Regional can share one map.
export const ICPC_LABEL_OVERRIDES: Record<string, Record<string, string>> = {};

export const AOJ_ICPC_TITLE_STYLE: ContestTableTitleStyle = {
  headingTag: 'h2',
  fontSize: 'text-xl',
  fontWeight: 'font-bold',
  bottomGap: 'pb-1',
};

// Prepend the assigned positional letter to an ICPC title for inline display (e.g. "A. name").
export function formatAojIcpcTitle(title: string, letter: string): string {
  return `${letter}. ${title}`;
}

// Return unique task_table_index values sorted numerically ascending.
export function sortAojIcpcHeaderIds(filtered: TaskResults): string[] {
  return Array.from(new Set(filtered.map((taskResult) => taskResult.task_table_index))).sort(
    (first, second) => Number(first) - Number(second),
  );
}

export function buildAojIcpcDisplayConfig(): ContestTableDisplayConfig {
  return {
    isShownHeader: false,
    isShownRoundLabel: false,
    roundLabelWidth: '',
    tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
    isShownTaskIndex: true,
    columnWrapThreshold: 6,
  };
}

// Build task_table_index -> letter map for one contest.
// Default: sort indices numerically asc, assign A, B, C...
// Override: if ICPC_LABEL_OVERRIDES[contestId] exists, use it.
export function buildAojIcpcLetterMap(
  contestId: string,
  taskTableIndices: string[],
): Map<string, string> {
  const override = ICPC_LABEL_OVERRIDES[contestId];

  if (override !== undefined) {
    return new Map(Object.entries(override));
  }

  const sorted = [...taskTableIndices].sort((first, second) => Number(first) - Number(second));
  const map = new Map<string, string>();

  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], String.fromCharCode(65 + i));
  }

  return map;
}
