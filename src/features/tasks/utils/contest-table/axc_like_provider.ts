import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';
import type { TaskResult } from '$lib/types/task';

import { classifyContest } from '$lib/utils/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

export class ABCLikeProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      const contestId = taskResult.contest_id;
      // Note: ACL Beginner Contest (ABL) will be shown in ACL provider, so exclude it here.
      return classifyContest(contestId) === this.contestType && contestId !== 'abl';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'ABC-Like Contest',
      abbreviationName: 'abcLike',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-28',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return contestId.toUpperCase();
  }
}
