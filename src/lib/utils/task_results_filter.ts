import type { TaskResults, TaskResult } from '$lib/types/task';
import { ContestType } from '$lib/types/contest';

import { classifyContest } from '$lib/utils/contest';

export const taskResultsForABCLatest20 = (taskResults: TaskResults) => {
  return new TaskResultsForABCLatest20(taskResults);
};

export const taskResultsFromABC319Onwards = (taskResults: TaskResults) => {
  return new TaskResultsFromABC319Onwards(taskResults);
};

// Note:
// Before and from ABC212 onwards, the number and tendency of tasks are very different.
export const taskResultsFromABC212ToABC318 = (taskResults: TaskResults) => {
  return new TaskResultsFromABC212ToABC318(taskResults);
};

export abstract class TaskResultsFilter {
  protected taskResults: TaskResults;

  constructor(taskResults: TaskResults) {
    this.taskResults = taskResults;
  }

  /**
   * Filter the taskResults using setCondition().
   *
   * @returns {TaskResults} The results of the filtered taskResults.
   */
  run(): TaskResults {
    return this.taskResults.filter(this.setCondition());
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
  protected abstract setCondition(): (taskResult: TaskResult) => boolean;
}

// ABC Latest 20 rounds
class TaskResultsForABCLatest20 extends TaskResultsFilter {
  run(): TaskResults {
    const CONTEST_ROUND_COUNT = 20;

    const taskResultsOnlyABC = this.taskResults.filter(this.setCondition());
    const latest20ContestIds = Array.from(
      new Set(taskResultsOnlyABC.map((taskResult: TaskResult) => taskResult.contest_id)),
    )
      .sort()
      .reverse()
      .slice(0, CONTEST_ROUND_COUNT);

    return taskResultsOnlyABC.filter((taskResult: TaskResult) =>
      latest20ContestIds.includes(taskResult.contest_id),
    );
  }

  // Note: Narrow down taskResults in advance to reduce time to display.
  protected setCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => classifyContest(taskResult.contest_id) === ContestType.ABC;
  }
}

// ABC319 〜 (2023/09/09 〜 )
// 7 tasks per contest
class TaskResultsFromABC319Onwards extends TaskResultsFilter {
  protected setCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) =>
      taskResult.contest_id >= 'abc319' && taskResult.contest_id <= 'abc999';
  }
}

// ABC212 〜 ABC318 (2021/07/31 〜 2023/09/02)
// 8 tasks per contest
class TaskResultsFromABC212ToABC318 extends TaskResultsFilter {
  protected setCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) =>
      taskResult.contest_id >= 'abc212' && taskResult.contest_id <= 'abc318';
  }
}
