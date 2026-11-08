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
import type { AtCoderJapanChampionshipEntry } from './atcoder_japan_championship_entries';

/**
 * One table per contest in the AtCoder 日本大会 group: AtCoder Japan Open and the NIKKEI contests before it.
 * The group mixes ARC / ARC-like qualifiers with onsite finals.
 */
export class AtCoderJapanChampionshipProvider extends ContestTableProviderBase {
  private readonly entry: AtCoderJapanChampionshipEntry;

  constructor(entry: AtCoderJapanChampionshipEntry) {
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
