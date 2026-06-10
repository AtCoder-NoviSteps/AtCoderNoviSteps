// contest_id -> (task_table_index -> letter). Used only for years with judge gaps.
export const ICPC_PRELIM_LABEL_OVERRIDES: Record<string, Record<string, string>> = {};

// Build task_table_index -> letter map for one contest.
// Default: sort indices numerically asc, assign A, B, C...
// Override: if ICPC_PRELIM_LABEL_OVERRIDES[contestId] exists, use it.
export function buildAojIcpcLetterMap(
  contestId: string,
  taskTableIndices: string[],
): Map<string, string> {
  const override = ICPC_PRELIM_LABEL_OVERRIDES[contestId];

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
