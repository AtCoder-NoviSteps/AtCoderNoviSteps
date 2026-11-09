import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResult, TaskResults } from '#lib/types/task.js';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '#features/tasks/types/contest-table/contest_table_provider.js';

import { ContestTableProviderBase } from './contest_table_provider_base';
import {
  sortHeaderIdsByTaskTableIndex,
  PER_CONTEST_TITLE_STYLE,
  buildPerContestDisplayConfig,
} from './per_contest_table_layout';

export type AtCoderChampionshipEntry = {
  contestId: string;
  // Builds the provider key (e.g. ARC::arc232); cell keys depend on it only for ABC, which no entry uses.
  contestType: ContestType;
  title: string;
};

export type AtCoderChampionshipEntries = AtCoderChampionshipEntry[];

/**
 * One table per contest in the AtCoder championship groups (AtCoder 日本大会 and AtCoder 世界大会).
 * An entry may be an ARC / ARC-like qualifier or an onsite final.
 */
export class AtCoderChampionshipProvider extends ContestTableProviderBase {
  private readonly entry: AtCoderChampionshipEntry;

  constructor(entry: AtCoderChampionshipEntry) {
    super(entry.contestType, entry.contestId); // provider key: ARC::arc232
    this.entry = entry;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === this.entry.contestId;
  }

  override getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortHeaderIdsByTaskTableIndex(filtered);
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: this.entry.title,
      abbreviationName: this.entry.contestId,
      titleStyle: PER_CONTEST_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildPerContestDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return this.entry.title;
  }
}
