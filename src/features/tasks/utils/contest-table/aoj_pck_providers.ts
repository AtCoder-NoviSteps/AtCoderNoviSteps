import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResult, TaskResults } from '#lib/types/task.js';
import type {
  ContestTableMetaData,
  ContestTableDisplayConfig,
} from '#features/tasks/types/contest-table/contest_table_provider.js';

import { ContestTableProviderBase } from './contest_table_provider_base';
import {
  sortHeaderIdsByTaskTableIndex,
  PER_CONTEST_TITLE_STYLE,
  buildPerContestDisplayConfig,
} from './per_contest_table_layout';

/** One PCK contest, with separate provider keys for each year and round. */
export class AojPckProvider extends ContestTableProviderBase {
  private readonly contestId: string;

  constructor(
    contestType: ContestType,
    private readonly year: number,
    private readonly round: 'Prelim' | 'Final',
  ) {
    super(contestType, `${round}${year}`);
    this.contestId = `PCK${round}${year}`;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult) => taskResult.contest_id === this.contestId;
  }

  override getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortHeaderIdsByTaskTableIndex(filtered);
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: this.getContestRoundLabel(this.contestId),
      abbreviationName: this.contestId,
      titleStyle: PER_CONTEST_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildPerContestDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return `PCK ${this.year} ${this.round === 'Prelim' ? '予選' : '本選'}`;
  }
}
