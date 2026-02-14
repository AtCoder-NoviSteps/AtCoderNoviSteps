import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

// ABC319 〜 (2023/09/09 〜 )
// 7 tasks per contest
export class ABC319OnwardsProvider extends ContestTableProviderBase {
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
      title: 'AtCoder Beginner Contest 319 〜（7 問制）',
      abbreviationName: 'abc319Onwards',
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
export class ABC212ToABC318Provider extends ContestTableProviderBase {
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
      title: 'AtCoder Beginner Contest 212 〜 318（8 問制）',
      abbreviationName: 'fromAbc212ToAbc318',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC126 〜 ABC211 (2019/05/19 〜 2021/07/24)
// 6 tasks per contest
//
// Note:
// Before and from ABC126 onwards, the number and tendency of tasks are very different.
export class ABC126ToABC211Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 126 && contestRound <= 211;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 126 〜 211（6 問制）',
      abbreviationName: 'fromAbc126ToAbc211',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC042 〜 ABC125 (2016/07/23 〜 2019/04/27)
// 4 tasks per contest
//
// Note:
// Before and from ABC042 onwards, the number and tendency of tasks are very different.
// From this round onwards, contests became rated.
export class ABC042ToABC125Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 42 && contestRound <= 125;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 042 〜 125（ARC 同時開催が大半）',
      abbreviationName: 'fromAbc042ToAbc125',
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
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC001 〜 ABC041 (2013/10/12 〜 2016/07/02)
// 4 tasks per contest
//
// Note: Unrated contests before ABC042.
export class ABC001ToABC041Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 1 && contestRound <= 41;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 001 〜 041（レーティング導入前）',
      abbreviationName: 'fromAbc001ToAbc041',
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
    return contestNameLabel.replace('ABC ', '');
  }
}
