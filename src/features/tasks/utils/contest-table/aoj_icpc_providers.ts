import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';

import { ContestTableProviderBase } from './contest_table_provider_base';
import {
  buildAojIcpcLetterMap,
  sortAojIcpcHeaderIds,
  AOJ_ICPC_TITLE_STYLE,
  buildAojIcpcDisplayConfig,
} from './aoj_icpc_labels';

export class AojIcpcPrelimProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number) {
    super(contestType, String(year)); // provider key: AOJ_ICPC::2025
    this.year = year;
    this.contestId = `ICPCPrelim${year}`;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === this.contestId;
  }

  getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortAojIcpcHeaderIds(filtered);
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: `ICPC 国内予選 ${this.year}`,
      abbreviationName: `icpcPrelim${this.year}`,
      titleStyle: AOJ_ICPC_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildAojIcpcDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return `ICPC 国内予選 ${this.year}`;
  }

  override getTaskLabels(filtered: TaskResults): Record<string, Record<string, string>> {
    const letterMap = buildAojIcpcLetterMap(
      this.contestId,
      filtered.map((taskResult) => taskResult.task_table_index),
    );

    return { [this.contestId]: Object.fromEntries(letterMap) };
  }
}

export class AojIcpcRegionalProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number) {
    super(contestType, String(year)); // provider key: AOJ_ICPC::1998
    this.year = year;
    this.contestId = `ICPCRegional${year}`;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === this.contestId;
  }

  getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortAojIcpcHeaderIds(filtered);
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: `ICPC アジア地区 ${this.year}`,
      abbreviationName: `icpcRegional${this.year}`,
      titleStyle: AOJ_ICPC_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildAojIcpcDisplayConfig();
  }

  getContestRoundLabel(_contestId: string): string {
    return `ICPC アジア地区 ${this.year}`;
  }

  override getTaskLabels(filtered: TaskResults): Record<string, Record<string, string>> {
    const letterMap = buildAojIcpcLetterMap(
      this.contestId,
      filtered.map((taskResult) => taskResult.task_table_index),
    );

    return { [this.contestId]: Object.fromEntries(letterMap) };
  }
}
