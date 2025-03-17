import type {
  ContestTableProvider,
  ContestTable,
  ContestTableMetaData,
} from '$lib/types/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResults, TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
import { getTaskTableHeaderName } from '$lib/utils/task';

export abstract class ContestTableProviderBase implements ContestTableProvider {
  protected contestType: ContestType;

  /**
   * Creates a new TaskTableGenerator instance.
   *
   * @param {ContestType} contestType - The type of contest associated with these tasks.
   */
  constructor(contestType: ContestType) {
    this.contestType = contestType;
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
  abstract getContestRoundLabel(contestId: string): string;
}

class ABCLatest20RoundsProvider extends ContestTableProviderBase {
  filter(taskResults: TaskResults): TaskResults {
    const taskResultsOnlyABC = taskResults.filter(this.setFilterCondition());

    const CONTEST_ROUND_COUNT = 20;
    const latest20ContestIds = Array.from(
      new Set(taskResultsOnlyABC.map((taskResult: TaskResult) => taskResult.contest_id)),
    )
      .sort()
      .reverse()
      .slice(0, CONTEST_ROUND_COUNT);

    return taskResultsOnlyABC.filter((task: TaskResult) =>
      latest20ContestIds.includes(task.contest_id),
    );
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    // Note: Narrow down taskResults in advance to reduce time to display.
    return (task: TaskResult) => classifyContest(task.contest_id) === ContestType.ABC;
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 最新 20 回',
      buttonLabel: 'ABC 最新 20 回',
      ariaLabel: 'Filter ABC latest 20 rounds',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC319 〜 (2023/09/09 〜 )
// 7 tasks per contest
class ABC319OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 319 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 319 〜 ',
      buttonLabel: 'ABC 319 〜 ',
      ariaLabel: 'Filter contests from ABC 319 onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC212 〜 ABC318 (2021/07/31 〜 2023/09/02)
// 8 tasks per contest
//
// Note:
// Before and from ABC212 onwards, the number and tendency of tasks are very different.
class ABC212ToABC318Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 212 && contestRound <= 318;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 212 〜 318',
      buttonLabel: 'ABC 212 〜 318',
      ariaLabel: 'Filter contests from ABC 212 to ABC 318',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

function parseContestRound(contestId: string, prefix: string): number {
  const withoutPrefix = contestId.replace(prefix, '');

  // Verify the prefix was present and the remaining string is numeric
  if (withoutPrefix === contestId || !/^\d+$/.test(withoutPrefix)) {
    throw new Error(`Invalid contest id has given: ${contestId}`);
  }

  return parseInt(withoutPrefix, 10);
}

// TODO: Add providers for other contest types if needs.
export const contestTableProviders = {
  abcLatest20Rounds: new ABCLatest20RoundsProvider(ContestType.ABC),
  abc319Onwards: new ABC319OnwardsProvider(ContestType.ABC),
  fromAbc212ToAbc318: new ABC212ToABC318Provider(ContestType.ABC),
};

export type ContestTableProviders = keyof typeof contestTableProviders;
