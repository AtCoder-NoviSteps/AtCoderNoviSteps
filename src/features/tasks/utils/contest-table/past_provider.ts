import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResult } from '#lib/types/task.js';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '#features/tasks/types/contest-table/contest_table_provider.js';

import { getContestNameLabel, getPastContestId } from '#lib/contests/index.js';

import { ContestTableProviderBase } from './contest_table_provider_base';
import { PER_CONTEST_TITLE_STYLE, buildPerContestDisplayConfig } from './per_contest_table_layout';

export class PastProvider extends ContestTableProviderBase {
  private readonly round: number;
  private readonly contestId: string;
  private readonly title: string;

  constructor(contestType: ContestType, round: number) {
    super(contestType, String(round)); // provider key: PAST::24
    this.round = round;
    this.contestId = getPastContestId(round);
    this.title = getContestNameLabel(this.contestId);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === this.contestId;
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: this.title,
      abbreviationName: `past${this.round}`,
      titleStyle: PER_CONTEST_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildPerContestDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return this.title;
  }
}
