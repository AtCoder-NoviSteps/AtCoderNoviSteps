import type { TaskResults, TaskResult } from '$lib/types/task';
import { ContestType } from '$lib/types/contest';

import { getContestNameLabel } from '$lib/utils/contest';
import { getTaskTableHeaderName } from '$lib/utils/task';

export const taskTableGeneratorForABCLatest20 = (
  taskResults: TaskResults,
  contestType: ContestType,
) => {
  return new TaskTableGeneratorForABCLatest20(taskResults, contestType);
};

export const taskTableGeneratorFromABC319Onwards = (
  taskResults: TaskResults,
  contestType: ContestType,
) => {
  return new TaskTableGeneratorFromABC319Onwards(taskResults, contestType);
};

export const taskTableGeneratorFromABC212ToABC318 = (
  taskResults: TaskResults,
  contestType: ContestType,
) => {
  return new TaskTableGeneratorFromABC212ToABC318(taskResults, contestType);
};

export abstract class TaskTableGenerator {
  protected selectedTaskResults: TaskResults;
  protected contestType: ContestType;

  /**
   * Creates a new TaskTableGenerator instance.
   *
   * @param {TaskResults} selectedTaskResults - The task results to be displayed in the table.
   * @param {ContestType} contestType - The type of contest associated with these tasks.
   */
  constructor(selectedTaskResults: TaskResults, contestType: ContestType) {
    this.selectedTaskResults = selectedTaskResults;
    this.contestType = contestType;
  }

  /**
   * Prepare a table for task and submission statuses.
   *
   * Computational complexity of preparation table: O(N), where N is the number of task results.
   * Computational complexity of accessing table: O(1).
   *
   * @returns A table for task and submission statuses.
   */
  run(): Record<string, Record<string, TaskResult>> {
    const table: Record<string, Record<string, TaskResult>> = {};

    this.selectedTaskResults.forEach((taskResult: TaskResult) => {
      const contestId = taskResult.contest_id;
      const taskTableIndex = getTaskTableHeaderName(this.contestType, taskResult);

      if (!table[contestId]) {
        table[contestId] = {};
      }

      table[contestId][taskTableIndex] = taskResult;
    });

    return table;
  }

  /**
   * Retrieves the unique identifiers for all contest rounds.
   *
   * @returns {Array<string>} An array of contest round identifiers.
   */
  getContestRoundIds(): Array<string> {
    const contestList = this.selectedTaskResults.map(
      (taskResult: TaskResult) => taskResult.contest_id,
    );
    return Array.from(new Set(contestList)).sort().reverse();
  }

  /**
   * Retrieves an array of header IDs associated with the current contest tasks.
   * These IDs are used to identify and display the relevant columns in the task table.
   *
   * @returns {Array<string>} An array of string IDs corresponding to the header columns for the task.
   */
  getHeaderIdsForTask(): Array<string> {
    const headerList = this.selectedTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(this.contestType, taskResult),
    );
    return Array.from(new Set(headerList)).sort();
  }

  /**
   * Returns a formatted label for the contest round.
   *
   * This abstract method must be implemented by subclasses to provide
   * a string representation of the contest round that can be displayed
   * in the task table.
   *
   * @param contestId - The ID of the contest.
   *
   * @returns {string} The formatted label string for the contest round.
   */
  abstract getContestRoundLabel(contestId: string): string;

  /**
   * Returns the title of the task table.
   *
   * @abstract This method must be implemented by subclasses.
   * @returns A string representing the title to be displayed for the task table.
   */
  abstract getTitle(): string;
}

class TaskTableGeneratorForABC extends TaskTableGenerator {
  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }

  getTitle(): string {
    return '';
  }
}

class TaskTableGeneratorForABCLatest20 extends TaskTableGeneratorForABC {
  getTitle(): string {
    return 'AtCoder Beginners Contest latest 20 rounds';
  }
}

class TaskTableGeneratorFromABC319Onwards extends TaskTableGeneratorForABC {
  getTitle(): string {
    return 'AtCoder Beginners Contest 319 〜 ';
  }
}

class TaskTableGeneratorFromABC212ToABC318 extends TaskTableGeneratorForABC {
  getTitle(): string {
    return 'AtCoder Beginners Contest 212 〜 318';
  }
}
