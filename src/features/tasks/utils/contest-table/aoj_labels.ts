import type { TaskResults } from '#lib/types/task.js';
import type {
  ContestTableDisplayConfig,
  ContestTableTitleStyle,
} from '#features/tasks/types/contest-table/contest_table_provider.js';

export const AOJ_TITLE_STYLE: ContestTableTitleStyle = {
  headingTag: 'h2',
  fontSize: 'text-xl',
  fontWeight: 'font-bold',
  bottomGap: 'pb-1',
};

// Return unique task_table_index values (problem letters) in ascending order.
export function sortAojHeaderIds(filtered: TaskResults): string[] {
  return Array.from(new Set(filtered.map((taskResult) => taskResult.task_table_index))).sort(
    (first, second) => first.localeCompare(second),
  );
}

export function buildAojDisplayConfig(): ContestTableDisplayConfig {
  return {
    isShownHeader: false,
    isShownRoundLabel: false,
    roundLabelWidth: '',
    tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
    isShownTaskIndex: true,
    columnWrapThreshold: 6,
  };
}
