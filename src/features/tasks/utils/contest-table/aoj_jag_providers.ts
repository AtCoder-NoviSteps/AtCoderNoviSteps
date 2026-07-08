import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';

import { ContestTableProviderBase } from './contest_table_provider_base';
import {
  buildAojLetterMap,
  sortAojHeaderIds,
  AOJ_TITLE_STYLE,
  buildAojDisplayConfig,
} from './aoj_labels';

/**
 * One JAG Domestic Preliminary (JAG 模擬国内) table, keyed by year.
 *
 * 2016 was held twice in the same year, so the seed splits it into
 * `JAGPrelim2016A` / `JAGPrelim2016B`. The optional `suffix` disambiguates
 * both the contest_id and the provider key (e.g. `AOJ_JAG::2016A`).
 */
export class JagPrelimProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly suffix: string; // '' | 'A' | 'B'
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number, suffix: '' | 'A' | 'B' = '') {
    super(contestType, `${year}${suffix}`); // provider key: AOJ_JAG::2016A
    this.year = year;
    this.suffix = suffix;
    this.contestId = `JAGPrelim${year}${suffix}`;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === this.contestId;
  }

  override getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortAojHeaderIds(filtered);
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: this.buildTitle(),
      abbreviationName: `jagPrelim${this.year}${this.suffix}`,
      titleStyle: AOJ_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildAojDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return this.buildTitle();
  }

  override getTaskLabels(filtered: TaskResults): Record<string, Record<string, string>> {
    const letterMap = buildAojLetterMap(
      this.contestId,
      filtered.map((taskResult) => taskResult.task_table_index),
    );

    return { [this.contestId]: Object.fromEntries(letterMap) };
  }

  private buildTitle(): string {
    return this.suffix ? `JAG 模擬国内 ${this.year} ${this.suffix}` : `JAG 模擬国内 ${this.year}`;
  }
}
