import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

// AWC0001 〜 0099 (2026/02/09 〜 2026/06/25)
// 5 tasks per contest
export class AWC0001To0099Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }
      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 1 && contestRound <= 99;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0001 〜 0099',
      abbreviationName: 'awc0001To0099',
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

// AWC0100 (2026/06/26. special edition, 15 tasks: A-O)
export class AWC0100Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0100'); // provider key = 'AWC::0100'
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'awc0100';
    };
  }

  getMetadata(): ContestTableMetaData {
    return { title: 'AtCoder Weekday Contest 0100', abbreviationName: 'awc0100' };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}

// AWC0101 onwards (2026/06/29 〜 )
// 5 tasks per contest. Upper bound 9999 = max of 4-digit format (cf. ARC104Onwards uses <= 999).
export class AWC0101OnwardsProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0101To9999');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 101 && contestRound <= 9999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0101 〜 ',
      abbreviationName: 'awc0101Onwards',
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
