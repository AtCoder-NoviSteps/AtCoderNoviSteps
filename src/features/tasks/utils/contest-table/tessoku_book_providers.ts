import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
  TESSOKU_SECTIONS,
} from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResult } from '$lib/types/task';

import { classifyContest } from '$lib/utils/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

/**
 * Base provider for Tessoku Book contests
 *
 * Note: This class is not intended to be registered directly.
 * Use specialized subclasses (TessokuBookForExamplesProvider,
 * TessokuBookForPracticalsProvider, TessokuBookForChallengesProvider) instead.
 *
 * @see https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/2820
 */
export class TessokuBookProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則',
      abbreviationName: 'tessoku-book',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}

export class TessokuBookForExamplesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.EXAMPLES);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('A')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（A. 例題）',
      abbreviationName: 'tessoku-book-for-examples',
    };
  }
}

export class TessokuBookForPracticalsProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.PRACTICALS);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('B')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（B. 応用問題）',
      abbreviationName: 'tessoku-book-for-practicals',
    };
  }
}

export class TessokuBookForChallengesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.CHALLENGES);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('C')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（C. 力試し問題）',
      abbreviationName: 'tessoku-book-for-challenges',
    };
  }
}
