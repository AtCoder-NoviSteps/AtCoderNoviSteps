import { ContestType } from '#lib/contests/types/contest.js';
import type { TaskResult } from '#lib/types/task.js';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '#features/tasks/types/contest-table/contest_table_provider.js';

import { ContestTableProviderBase } from './contest_table_provider_base';
import { PER_CONTEST_TITLE_STYLE, buildPerContestDisplayConfig } from './per_contest_table_layout';

export type AtCoderChampionshipEntry = {
  contestId: string;
  // Builds the provider key (e.g. ARC::arc232); for ABC it also renames problem H to the H/Ex cell key.
  contestType: ContestType;
  title: string;
};

export type AtCoderChampionshipEntries = AtCoderChampionshipEntry[];

/**
 * One table per contest in the AtCoder championship groups
 * (AtCoder 世界大会, AtCoder 日本大会 and 日本最強プログラマー学生選手権).
 * An entry may be an ABC / ARC / ABC-like / ARC-like qualifier or an onsite final.
 * Header ids come from the base class, which keys Ex as H/Ex like generateTable so it sorts last.
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
