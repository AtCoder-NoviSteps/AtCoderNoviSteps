import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest } from '$lib/utils/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

export class Typical90Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競プロ典型 90 問',
      abbreviationName: 'typical90',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label in Typical90
      tableBodyCellsWidth: 'w-1/2 xl:w-1/3 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
