import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest } from '$lib/utils/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

export class ABSProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginners Selection',
      abbreviationName: 'abs',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2',
      roundLabelWidth: '', // No specific width for the round label
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
