import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest } from '$lib/contests';

import { ContestTableProviderBase } from './contest_table_provider_base';

export class AALCProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'aalc001';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: "AAL Contest 001: Let's use segtree!",
      abbreviationName: 'aalc001',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for task index in AAL Contest 001
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
