import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

// AWC0001 〜 (2026/02/09 〜 )
// 5 tasks per contest
export class AWC0001OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }
      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 1 && contestRound <= 9999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0001 〜 ',
      abbreviationName: 'awc0001Onwards',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AWC ', '');
  }
}
