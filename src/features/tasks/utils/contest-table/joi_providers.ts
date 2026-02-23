import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
  JOI_SECOND_QUAL_ROUND_SECTIONS,
  JOI_FINAL_ROUND_SECTIONS,
} from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

const regexForJoiFirstQualRound = /^(joi)(\d{4})(yo1)(a|b|c)$/i;

export class JOIFirstQualRoundProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiFirstQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 一次予選',
      abbreviationName: 'joiFirstQualRound',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 一次予選 ', '');
  }
}

const regexForJoiSecondQualRound = /^(joi)(\d{4})(yo2)$/i;

export class JOISecondQualRound2020OnwardsProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_SECOND_QUAL_ROUND_SECTIONS['2020Onwards']);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiSecondQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 二次予選',
      abbreviationName: 'joiSecondQualRound2020Onwards',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 二次予選 ', '');
  }
}

const regexForJoiQualRound = /^(joi)(\d{4})(yo)$/i;

export class JOIQualRoundFrom2006To2019Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_SECOND_QUAL_ROUND_SECTIONS.from2006To2019);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 予選（旧形式）',
      abbreviationName: 'joiQualRoundFrom2006To2019',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 予選 ', '');
  }
}

const regexForJoiSemiFinalRound = /^(joi)(\d{4})(ho|sf)$/i;

// Note: The JOI semi-final stage, which was renamed from the final round starting in 2026, is essentially the same as the final round in terms of its role in the competition.
// Therefore, we can use the same provider for both the final round and the semi-final stage, as they share the same structure and purpose in the contest.
export class JOISemiFinalRoundProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_FINAL_ROUND_SECTIONS.semiFinal);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiSemiFinalRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 本選',
      abbreviationName: 'joiSemiFinalRound',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 本選 ', '').replace('JOI セミファイナルステージ ', '');
  }
}
