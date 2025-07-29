import type {
  ContestTableProvider,
  ContestTable,
  ContestTableMetaData,
  ContestTablesMetaData,
  ContestTableDisplayConfig,
} from '$lib/types/contest_table_provider';
import { ContestType } from '$lib/types/contest';
import type { TaskResults, TaskResult } from '$lib/types/task';

import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
import { getTaskTableHeaderName } from '$lib/utils/task';

/**
 * How to add a new contest table provider:
 *
 * Step 1: Create a new provider class
 *   - Extend ContestTableProviderBase
 *   - Implement abstract methods: setFilterCondition(), getMetadata(), getContestRoundLabel()
 *   - Example: export class MyNewProvider extends ContestTableProviderBase { ... }
 *
 * Step 2: Register using prepareContestProviderPresets
 *   - Add the new provider to prepareContestProviderPresets() that returns preset functions
 *   - Example: MyNewProvider: () => new ContestTableProviderGroup(...).addProvider(...)
 *
 * Step 3: Export in contestTableProviderGroups
 *   - Add the new provider group to the contestTableProviderGroups object
 *   - Example: myNewProvider: prepareContestProviderPresets().MyNewProvider()
 */

export abstract class ContestTableProviderBase implements ContestTableProvider {
  protected contestType: ContestType;

  /**
   * Creates a new TaskTableGenerator instance.
   *
   * @param {ContestType} contestType - The type of contest associated with these tasks.
   */
  constructor(contestType: ContestType) {
    this.contestType = contestType;
  }

  filter(taskResults: TaskResults): TaskResults {
    return taskResults.filter(this.setFilterCondition());
  }

  /**
   * This is an abstract method that must be implemented by any subclass.
   * It is intended to set a condition that will be used to filter task results.
   *
   * @abstract
   * @protected
   * @returns {(taskResult: TaskResult) => boolean} A function that takes a TaskResult
   * and returns a boolean indicating whether the task result meets the condition.
   */
  protected abstract setFilterCondition(): (taskResult: TaskResult) => boolean;

  /**
   * Generate a table for task and submission statuses.
   *
   * Computational complexity of preparation table: O(N), where N is the number of task results.
   * Computational complexity of accessing table: O(1).
   *
   * @returns A table for task and submission statuses.
   */
  generateTable(filteredTaskResults: TaskResults): ContestTable {
    const table: ContestTable = {};

    filteredTaskResults.forEach((taskResult: TaskResult) => {
      const contestId = taskResult.contest_id;
      const taskTableIndex = getTaskTableHeaderName(this.contestType, taskResult);

      if (!table[contestId]) {
        table[contestId] = {};
      }

      table[contestId][taskTableIndex] = taskResult;
    });

    return table;
  }

  getContestRoundIds(filteredTaskResults: TaskResults): Array<string> {
    const contestList = filteredTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    return Array.from(new Set(contestList)).sort().reverse();
  }

  getHeaderIdsForTask(filteredTaskResults: TaskResults): Array<string> {
    const headerList = filteredTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(this.contestType, taskResult),
    );
    return Array.from(new Set(headerList)).sort();
  }

  abstract getMetadata(): ContestTableMetaData;

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16', // Default width for task index column
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1', // Default width for table body cells
      isShownTaskIndex: false,
    };
  }

  abstract getContestRoundLabel(contestId: string): string;
}

export class ABCLatest20RoundsProvider extends ContestTableProviderBase {
  filter(taskResults: TaskResults): TaskResults {
    const taskResultsOnlyABC = taskResults.filter(this.setFilterCondition());

    const CONTEST_ROUND_COUNT = 20;
    const latest20ContestIds = Array.from(
      new Set(taskResultsOnlyABC.map((taskResult: TaskResult) => taskResult.contest_id)),
    )
      .sort()
      .reverse()
      .slice(0, CONTEST_ROUND_COUNT);

    return taskResultsOnlyABC.filter((task: TaskResult) =>
      latest20ContestIds.includes(task.contest_id),
    );
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    // Note: Narrow down taskResults in advance to reduce time to display.
    return (task: TaskResult) => classifyContest(task.contest_id) === ContestType.ABC;
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 最新 20 回',
      abbreviationName: 'abcLatest20Rounds',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC319 〜 (2023/09/09 〜 )
// 7 tasks per contest
export class ABC319OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 319 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 319 〜 ',
      abbreviationName: 'abc319Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC212 〜 ABC318 (2021/07/31 〜 2023/09/02)
// 8 tasks per contest
//
// Note:
// Before and from ABC212 onwards, the number and tendency of tasks are very different.
export class ABC212ToABC318Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 212 && contestRound <= 318;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 212 〜 318',
      abbreviationName: 'fromAbc212ToAbc318',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

function parseContestRound(contestId: string, prefix: string): number {
  const withoutPrefix = contestId.replace(prefix, '');

  // Verify the prefix was present and the remaining string is numeric
  if (withoutPrefix === contestId || !/^\d+$/.test(withoutPrefix)) {
    throw new Error(`Invalid contest id has given: ${contestId}`);
  }

  return parseInt(withoutPrefix, 10);
}

export class EDPCProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'dp';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'Educational DP Contest / DP まとめコンテスト',
      abbreviationName: 'edpc',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for task index in EDPC
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

export class TDPCProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'tdpc';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'Typical DP Contest',
      abbreviationName: 'tdpc',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for task index in TDPC
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

const regexForJoiFirstQualRound = /^(joi)(\d{4})(yo1)(a|b|c)$/i;

export class JOIFirstQualRoundProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiFirstQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 一次予選',
      abbreviationName: 'joiFirstQualRound',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 一次予選 ', '');
  }
}

export class Typical90Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'typical90';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競プロ典型 90 問',
      abbreviationName: 'typical90',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label in Typical90
      tableBodyCellsWidth: 'w-1/2 lg:w-1/3 xl:w-1/4 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

/**
 * A class that manages individual provider groups
 * Manages multiple ContestTableProviders as a single group,
 * enabling group-level operations.
 */
export class ContestTableProviderGroup {
  private groupName: string;
  private metadata: ContestTablesMetaData;
  private providers = new Map<ContestType, ContestTableProviderBase>();

  constructor(groupName: string, metadata: ContestTablesMetaData) {
    this.groupName = groupName;
    this.metadata = metadata;
  }

  /**
   * Add a provider
   * @param contestType Contest type
   * @param provider Provider instance
   * @returns Returns this for method chaining
   */
  addProvider(contestType: ContestType, provider: ContestTableProviderBase): this {
    this.providers.set(contestType, provider);
    return this;
  }

  /**
   * Add multiple providers in pairs
   * @param providers Array of contest type and provider pairs
   * @returns Returns this for method chaining
   */
  addProviders(
    ...providers: Array<{
      contestType: ContestType;
      provider: ContestTableProviderBase;
    }>
  ): this {
    providers.forEach(({ contestType, provider }) => {
      this.providers.set(contestType, provider);
    });
    return this;
  }

  /**
   * Get a provider for a specific contest type
   * @param contestType Contest type
   * @returns Provider instance, or undefined
   */
  getProvider(contestType: ContestType): ContestTableProviderBase | undefined {
    return this.providers.get(contestType);
  }

  /**
   * Get all providers in the group
   * @returns Array of providers
   */
  getAllProviders(): ContestTableProviderBase[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get the group name
   * @returns Group name
   */
  getGroupName(): string {
    return this.groupName;
  }

  /**
   * Get the metadata for the group
   * @returns Metadata for the group
   */
  getMetadata(): ContestTablesMetaData {
    return this.metadata;
  }

  /**
   * Get the number of providers in the group
   * @returns Number of providers
   */
  getSize(): number {
    return this.providers.size;
  }

  /**
   * Get group statistics
   * @returns Group statistics
   */
  getStats() {
    return {
      groupName: this.groupName,
      providerCount: this.providers.size,
      providers: Array.from(this.providers.entries()).map(([type, provider]) => ({
        contestType: type,
        metadata: provider.getMetadata(),
        displayConfig: provider.getDisplayConfig(),
      })),
    };
  }
}

/**
 * Prepare predefined provider groups
 * Easily create groups with commonly used combinations
 */
export const prepareContestProviderPresets = () => {
  return {
    /**
     * Single group for ABC latest 20 rounds
     */
    ABCLatest20Rounds: () =>
      new ContestTableProviderGroup(`ABC Latest 20 Rounds`, {
        buttonLabel: 'ABC 最新 20 回',
        ariaLabel: 'Filter ABC latest 20 rounds',
      }).addProvider(ContestType.ABC, new ABCLatest20RoundsProvider(ContestType.ABC)),

    /**
     * Single group for ABC 319 onwards
     */
    ABC319Onwards: () =>
      new ContestTableProviderGroup(`ABC 319 Onwards`, {
        buttonLabel: 'ABC 319 〜 ',
        ariaLabel: 'Filter contests from ABC 319 onwards',
      }).addProvider(ContestType.ABC, new ABC319OnwardsProvider(ContestType.ABC)),

    /**
     * Single group for ABC 212-318
     */
    ABC212ToABC318: () =>
      new ContestTableProviderGroup(`From ABC 212 to ABC 318`, {
        buttonLabel: 'ABC 212 〜 318',
        ariaLabel: 'Filter contests from ABC 212 to ABC 318',
      }).addProvider(ContestType.ABC, new ABC212ToABC318Provider(ContestType.ABC)),

    /**
     * DP group (EDPC and TDPC)
     */
    dps: () =>
      new ContestTableProviderGroup(`EDPC・TDPC`, {
        buttonLabel: 'EDPC・TDPC',
        ariaLabel: 'EDPC and TDPC contests',
      }).addProviders(
        { contestType: ContestType.EDPC, provider: new EDPCProvider(ContestType.EDPC) },
        { contestType: ContestType.TDPC, provider: new TDPCProvider(ContestType.TDPC) },
      ),

    JOIFirstQualRound: () =>
      new ContestTableProviderGroup(`JOI 一次予選`, {
        buttonLabel: 'JOI 一次予選',
        ariaLabel: 'Filter JOI First Qualifying Round',
      }).addProvider(ContestType.JOI, new JOIFirstQualRoundProvider(ContestType.JOI)),

    /**
     * Single group for Typical 90 Problems
     */
    Typical90: () =>
      new ContestTableProviderGroup(`競プロ典型 90 問`, {
        buttonLabel: '競プロ典型 90 問',
        ariaLabel: 'Filter Typical 90 Problems',
      }).addProvider(ContestType.TYPICAL90, new Typical90Provider(ContestType.TYPICAL90)),
  };
};

export const contestTableProviderGroups = {
  abcLatest20Rounds: prepareContestProviderPresets().ABCLatest20Rounds(),
  abc319Onwards: prepareContestProviderPresets().ABC319Onwards(),
  fromAbc212ToAbc318: prepareContestProviderPresets().ABC212ToABC318(),
  dps: prepareContestProviderPresets().dps(), // Dynamic Programming (DP) Contests
  joiFirstQualRound: prepareContestProviderPresets().JOIFirstQualRound(),
  typical90: prepareContestProviderPresets().Typical90(),
};

export type ContestTableProviderGroups = keyof typeof contestTableProviderGroups;
