import {
  type ContestTableProvider,
  type ContestTable,
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
  type ProviderKey,
} from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResults, TaskResult } from '$lib/types/task';

import { getTaskTableHeaderName } from '$lib/utils/task';

export abstract class ContestTableProviderBase implements ContestTableProvider {
  protected readonly contestType: ContestType;
  protected readonly section?: string;

  /**
   * Creates a new TaskTableGenerator instance.
   *
   * @param {ContestType} contestType - The type of contest associated with these tasks.
   * @param {string} [section] - Optional section identifier (e.g., 'examples', 'practicals', 'challenges').
   */
  constructor(contestType: ContestType, section?: string) {
    this.contestType = contestType;
    this.section = section;
  }

  /**
   * Create a provider key combining contestType and section
   *
   * @param {ContestType} contestType - Contest type
   * @param {string} [section] - Optional section identifier
   * @returns {ProviderKey} Provider key (e.g., 'TESSOKU_BOOK' or 'TESSOKU_BOOK::examples')
   */
  static createProviderKey(contestType: ContestType, section?: string): ProviderKey {
    return section ? `${contestType}::${section}` : `${contestType}`;
  }

  /**
   * Get this provider's key
   * Combines contestType and section to create a unique identifier
   *
   * @returns {ProviderKey} This provider's key
   */
  getProviderKey(): ProviderKey {
    return ContestTableProviderBase.createProviderKey(this.contestType, this.section);
  }

  filter(taskResults: TaskResults): TaskResults {
    return taskResults.filter(this.setFilterCondition());
  }

  /**
   * This is an abstract method that must be implemented by any subclass.
   * It is intended to set a condition that will be used to filter task results.
   *
   * @abstract
   * @protected
   * @returns {(taskResult: TaskResult) => boolean} A function that takes a TaskResult
   * and returns a boolean indicating whether the task result meets the condition.
   */
  protected abstract setFilterCondition(): (taskResult: TaskResult) => boolean;

  /**
   * Generate a table for task and submission statuses.
   *
   * Computational complexity of preparation table: O(N), where N is the number of task results.
   * Computational complexity of accessing table: O(1).
   *
   * @returns A table for task and submission statuses.
   */
  generateTable(filteredTaskResults: TaskResults): ContestTable {
    const table: ContestTable = {};

    filteredTaskResults.forEach((taskResult: TaskResult) => {
      const contestId = taskResult.contest_id;
      const taskTableIndex = getTaskTableHeaderName(this.contestType, taskResult);

      if (!table[contestId]) {
        table[contestId] = {};
      }

      table[contestId][taskTableIndex] = taskResult;
    });

    return table;
  }

  getContestRoundIds(filteredTaskResults: TaskResults): Array<string> {
    const contestList = filteredTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    return Array.from(new Set(contestList)).sort().reverse();
  }

  getHeaderIdsForTask(filteredTaskResults: TaskResults): Array<string> {
    const headerList = filteredTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(this.contestType, taskResult),
    );
    return Array.from(new Set(headerList)).sort();
  }

  abstract getMetadata(): ContestTableMetaData;

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16', // Default width for task index column
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1', // Default width for table body cells
      isShownTaskIndex: false,
    };
  }

  abstract getContestRoundLabel(contestId: string): string;
}

export function parseContestRound(contestId: string, prefix: string): number {
  const withoutPrefix = contestId.replace(prefix, '');

  // Verify the prefix was present and the remaining string is numeric
  if (withoutPrefix === contestId || !/^\d+$/.test(withoutPrefix)) {
    throw new Error(`Invalid contest id has given: ${contestId}`);
  }

  return parseInt(withoutPrefix, 10);
}
