import { ContestType } from '$lib/types/contest';
import type { TaskResult, TaskResults } from '$lib/types/task';
import {
  type ContestTableMetaData,
  type ContestTableDisplayConfig,
} from '$features/tasks/types/contest-table/contest_table_provider';

import { ContestTableProviderBase } from './contest_table_provider_base';
import { buildAojIcpcLetterMap } from './aoj_icpc_labels';

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

  // Ensure left-to-right cell order is numeric (A,B,C...). Safeguard for variable-width ids.
  getHeaderIdsForTask(filtered: TaskResults): string[] {
    return Array.from(new Set(filtered.map((taskResult) => taskResult.task_table_index))).sort(
      (first, second) => Number(first) - Number(second),
    );
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: `ICPC 国内予選 ${this.year}`,
      abbreviationName: `icpcPrelim${this.year}`,
      titleStyle: {
        headingTag: 'h3',
        fontSize: 'text-base',
        fontWeight: 'font-normal',
        bottomGap: 'pb-1',
      },
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2',
      isShownTaskIndex: true,
    };
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
