import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

// ARC104 〜 (2020/10/03 〜 )
// 4 〜 7 tasks per contest
export class ARC104OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 104 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 104 〜 ',
      abbreviationName: 'arc104Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}

// ARC058 〜 ARC103 (2016/07/23 〜 2018/09/29)
// 4 tasks per contest
//
// Note:
// Before and from ARC058 onwards, the number and tendency of tasks are very different.
// From this round onwards, contests became rated.
export class ARC058ToARC103Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 58 && contestRound <= 103;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 058 〜 103（ABC 同時開催）',
      abbreviationName: 'fromArc058ToArc103',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}

// ARC001 〜 ARC057 (2012/04/12 〜 2016/07/09)
// 4 tasks per contest
//
// Note: Unrated contests before ARC058.
export class ARC001ToARC057Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 1 && contestRound <= 57;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 001 〜 057（レーティング導入前）',
      abbreviationName: 'fromArc001ToArc057',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}
