import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/contests/types/contest';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/contests/utils/contest';

import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';

interface AWCProviderConfig {
  section: string;
  title: string;
  abbreviationName: string;
}

interface AWCRangeConfig extends AWCProviderConfig {
  minRound: number;
  maxRound: number;
}

interface AWCSpecialContestConfig extends AWCProviderConfig {
  contestId: string;
}

const RANGE_DISPLAY_CONFIG: ContestTableDisplayConfig = {
  isShownHeader: true,
  isShownRoundLabel: true,
  roundLabelWidth: 'xl:w-16',
  tableBodyCellsWidth: 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1',
  isShownTaskIndex: false,
};

const SPECIAL_CONTEST_DISPLAY_CONFIG: ContestTableDisplayConfig = {
  isShownHeader: false,
  isShownRoundLabel: false,
  roundLabelWidth: '',
  tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
  isShownTaskIndex: true,
};

export class AWCRangeProvider extends ContestTableProviderBase {
  private readonly minRound: number;
  private readonly maxRound: number;
  private readonly title: string;
  private readonly abbreviationName: string;

  constructor(contestType: ContestType, config: AWCRangeConfig) {
    super(contestType, config.section);

    this.minRound = config.minRound;
    this.maxRound = config.maxRound;
    this.title = config.title;
    this.abbreviationName = config.abbreviationName;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= this.minRound && contestRound <= this.maxRound;
    };
  }

  getMetadata(): ContestTableMetaData {
    return { title: this.title, abbreviationName: this.abbreviationName };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return RANGE_DISPLAY_CONFIG;
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AWC ', '');
  }
}

export class AWCSpecialContestProvider extends ContestTableProviderBase {
  private readonly contestId: string;
  private readonly title: string;
  private readonly abbreviationName: string;

  constructor(contestType: ContestType, config: AWCSpecialContestConfig) {
    super(contestType, config.section);

    this.contestId = config.contestId;
    this.title = config.title;
    this.abbreviationName = config.abbreviationName;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === this.contestId;
    };
  }

  getMetadata(): ContestTableMetaData {
    return { title: this.title, abbreviationName: this.abbreviationName };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return SPECIAL_CONTEST_DISPLAY_CONFIG;
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
