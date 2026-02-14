import {
  type ContestTableMetaData,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

// AGC001 〜 (2016/07/16 〜 )
// 4 〜 7 tasks per contest
export class AGC001OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'agc');
      return contestRound >= 1 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Grand Contest 001 〜 ',
      abbreviationName: 'agc001Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AGC ', '');
  }
}
