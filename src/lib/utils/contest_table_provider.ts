import {
  type ContestTableProvider,
  type ContestTable,
  type ContestTableMetaData,
  type ContestTablesMetaData,
  type ContestTableDisplayConfig,
  type ProviderKey,
  TESSOKU_SECTIONS,
  JOI_SECOND_QUAL_ROUND_SECTIONS,
  JOI_FINAL_ROUND_SECTIONS,
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
  protected readonly contestType: ContestType;
  protected readonly section?: string;

  /**
   * Creates a new TaskTableGenerator instance.
   *
   * @param {ContestType} contestType - The type of contest associated with these tasks.
   * @param {string} [section] - Optional section identifier (e.g., 'examples', 'practicals', 'challenges').
   */
  constructor(contestType: ContestType, section?: string) {
    this.contestType = contestType;
    this.section = section;
  }

  /**
   * Create a provider key combining contestType and section
   *
   * @param {ContestType} contestType - Contest type
   * @param {string} [section] - Optional section identifier
   * @returns {ProviderKey} Provider key (e.g., 'TESSOKU_BOOK' or 'TESSOKU_BOOK::examples')
   */
  static createProviderKey(contestType: ContestType, section?: string): ProviderKey {
    return section ? `${contestType}::${section}` : `${contestType}`;
  }

  /**
   * Get this provider's key
   * Combines contestType and section to create a unique identifier
   *
   * @returns {ProviderKey} This provider's key
   */
  getProviderKey(): ProviderKey {
    return ContestTableProviderBase.createProviderKey(this.contestType, this.section);
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

export class ABSProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginners Selection',
      abbreviationName: 'abs',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2',
      roundLabelWidth: '', // No specific width for the round label
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
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
      title: 'AtCoder Beginner Contest 319 〜（7 問制）',
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
      title: 'AtCoder Beginner Contest 212 〜 318（8 問制）',
      abbreviationName: 'fromAbc212ToAbc318',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC126 〜 ABC211 (2019/05/19 〜 2021/07/24)
// 6 tasks per contest
//
// Note:
// Before and from ABC126 onwards, the number and tendency of tasks are very different.
export class ABC126ToABC211Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 126 && contestRound <= 211;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 126 〜 211（6 問制）',
      abbreviationName: 'fromAbc126ToAbc211',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC042 〜 ABC125 (2016/07/23 〜 2019/04/27)
// 4 tasks per contest
//
// Note:
// Before and from ABC042 onwards, the number and tendency of tasks are very different.
// From this round onwards, contests became rated.
export class ABC042ToABC125Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 42 && contestRound <= 125;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 042 〜 125（ARC 同時開催が大半）',
      abbreviationName: 'fromAbc042ToAbc125',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ABC001 〜 ABC041 (2013/10/12 〜 2016/07/02)
// 4 tasks per contest
//
// Note: Unrated contests before ABC042.
export class ABC001ToABC041Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'abc');
      return contestRound >= 1 && contestRound <= 41;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 001 〜 041（レーティング導入前）',
      abbreviationName: 'fromAbc001ToAbc041',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}

// ARC104 〜 (2020/10/03 〜 )
// 4 〜 7 tasks per contest
export class ARC104OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 104 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 104 〜 ',
      abbreviationName: 'arc104Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}

// ARC058 〜 ARC103 (2016/07/23 〜 2018/09/29)
// 4 tasks per contest
//
// Note:
// Before and from ARC058 onwards, the number and tendency of tasks are very different.
// From this round onwards, contests became rated.
export class ARC058ToARC103Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 58 && contestRound <= 103;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 058 〜 103（ABC 同時開催）',
      abbreviationName: 'fromArc058ToArc103',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}

// ARC001 〜 ARC057 (2012/04/12 〜 2016/07/09)
// 4 tasks per contest
//
// Note: Unrated contests before ARC058.
export class ARC001ToARC057Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'arc');
      return contestRound >= 1 && contestRound <= 57;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Regular Contest 001 〜 057（レーティング導入前）',
      abbreviationName: 'fromArc001ToArc057',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      roundLabelWidth: 'xl:w-16',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ARC ', '');
  }
}

// AGC001 〜 (2016/07/16 〜 )
// 4 〜 7 tasks per contest
export class AGC001OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'agc');
      return contestRound >= 1 && contestRound <= 999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Grand Contest 001 〜 ',
      abbreviationName: 'agc001Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AGC ', '');
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

export class Typical90Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
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
      tableBodyCellsWidth: 'w-1/2 xl:w-1/3 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

/**
 * Base provider for Tessoku Book contests
 *
 * Note: This class is not intended to be registered directly.
 * Use specialized subclasses (TessokuBookForExamplesProvider,
 * TessokuBookForPracticalsProvider, TessokuBookForChallengesProvider) instead.
 *
 * @see https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/2820
 */
export class TessokuBookProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則',
      abbreviationName: 'tessoku-book',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

export class TessokuBookForExamplesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.EXAMPLES);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('A')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（A. 例題）',
      abbreviationName: 'tessoku-book-for-examples',
    };
  }
}

export class TessokuBookForPracticalsProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.PRACTICALS);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('B')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（B. 応用問題）',
      abbreviationName: 'tessoku-book-for-practicals',
    };
  }
}

export class TessokuBookForChallengesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, TESSOKU_SECTIONS.CHALLENGES);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('C')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（C. 力試し問題）',
      abbreviationName: 'tessoku-book-for-challenges',
    };
  }
}
export class MathAndAlgorithmProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'アルゴリズムと数学',
      abbreviationName: 'math-and-algorithm',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
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

export class FPS24Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'fps-24';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'FPS 24 題',
      abbreviationName: 'fps-24',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for task index in FPS 24
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}

export class ACLPracticeProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Library Practice Contest',
      abbreviationName: 'aclPractice',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '', // No specific width for the round label
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
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

const regexForJoiSecondQualRound = /^(joi)(\d{4})(yo2)$/i;

export class JOISecondQualRound2020OnwardsProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_SECOND_QUAL_ROUND_SECTIONS['2020Onwards']);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiSecondQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 二次予選',
      abbreviationName: 'joiSecondQualRound2020Onwards',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 二次予選 ', '');
  }
}

const regexForJoiQualRound = /^(joi)(\d{4})(yo)$/i;

export class JOIQualRoundFrom2006To2019Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_SECOND_QUAL_ROUND_SECTIONS.from2006To2019);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiQualRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 予選（旧形式）',
      abbreviationName: 'joiQualRoundFrom2006To2019',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 予選 ', '');
  }
}

const regexForJoiSemiFinalRound = /^(joi)(\d{4})(ho)$/i;

export class JOISemiFinalRoundProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, JOI_FINAL_ROUND_SECTIONS.semiFinal);
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return regexForJoiSemiFinalRound.test(taskResult.contest_id);
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'JOI 本選',
      abbreviationName: 'joiSemiFinalRound',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      isShownTaskIndex: false,
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 px-1 py-1',
      roundLabelWidth: 'xl:w-28',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('JOI 本選 ', '');
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
  private providers = new Map<string, ContestTableProviderBase>();

  constructor(groupName: string, metadata: ContestTablesMetaData) {
    this.groupName = groupName;
    this.metadata = metadata;
  }

  /**
   * Add a provider
   * Provider key is determined by the provider's getProviderKey() method
   *
   * @param provider Provider instance
   * @returns Returns this for method chaining
   */
  addProvider(provider: ContestTableProviderBase): this {
    const key = provider.getProviderKey();
    this.providers.set(key, provider);
    return this;
  }

  /**
   * Add multiple providers
   * Each provider's key is determined by its getProviderKey() method
   *
   * @param providers Array of provider instances
   * @returns Returns this for method chaining
   */
  addProviders(...providers: ContestTableProviderBase[]): this {
    providers.forEach((provider) => {
      const key = provider.getProviderKey();
      this.providers.set(key, provider);
    });
    return this;
  }

  /**
   * Get a provider for a specific contest type and optional section
   * Maintains backward compatibility by supporting section-less lookups
   *
   * @param contestType Contest type
   * @param section Optional section identifier
   * @returns Provider instance, or undefined
   */
  getProvider(contestType: ContestType, section?: string): ContestTableProviderBase | undefined {
    const key = ContestTableProviderBase.createProviderKey(contestType, section);
    return this.providers.get(key);
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
      providers: Array.from(this.providers.entries()).map(([key, provider]) => ({
        providerKey: key,
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
     * Single group for AtCoder Beginners Selection
     */
    ABS: () =>
      new ContestTableProviderGroup(`AtCoder Beginners Selection`, {
        buttonLabel: 'ABS',
        ariaLabel: 'Filter AtCoder Beginners Selection',
      }).addProvider(new ABSProvider(ContestType.ABS)),

    /**
     * Single group for ABC latest 20 rounds
     */
    ABCLatest20Rounds: () =>
      new ContestTableProviderGroup(`ABC Latest 20 Rounds`, {
        buttonLabel: 'ABC 最新 20 回',
        ariaLabel: 'Filter ABC latest 20 rounds',
      }).addProvider(new ABCLatest20RoundsProvider(ContestType.ABC)),

    /**
     * Single group for ABC 319 onwards
     */
    ABC319Onwards: () =>
      new ContestTableProviderGroup(`ABC 319 Onwards`, {
        buttonLabel: 'ABC 319 〜 ',
        ariaLabel: 'Filter contests from ABC 319 onwards',
      }).addProvider(new ABC319OnwardsProvider(ContestType.ABC)),

    /**
     * Single group for ABC 212-318
     */
    ABC212ToABC318: () =>
      new ContestTableProviderGroup(`From ABC 212 to ABC 318`, {
        buttonLabel: 'ABC 212 〜 318',
        ariaLabel: 'Filter contests from ABC 212 to ABC 318',
      }).addProvider(new ABC212ToABC318Provider(ContestType.ABC)),

    /**
     * Single group for ABC 126-211
     */
    ABC126ToABC211: () =>
      new ContestTableProviderGroup(`From ABC 126 to ABC 211`, {
        buttonLabel: 'ABC 126 〜 211',
        ariaLabel: 'Filter contests from ABC 126 to ABC 211',
      }).addProvider(new ABC126ToABC211Provider(ContestType.ABC)),

    /**
     * Single group for ABC 042-125
     */
    ABC042ToABC125: () =>
      new ContestTableProviderGroup(`From ABC 042 to ABC 125`, {
        buttonLabel: 'ABC 042 〜 125',
        ariaLabel: 'Filter contests from ABC 042 to ABC 125',
      }).addProvider(new ABC042ToABC125Provider(ContestType.ABC)),

    /**
     * Single group for ABC 001-041
     */
    ABC001ToABC041: () =>
      new ContestTableProviderGroup(`From ABC 001 to ABC 041`, {
        buttonLabel: '旧 ABC',
        ariaLabel: 'Filter contests from ABC 001 to ABC 041',
      }).addProvider(new ABC001ToABC041Provider(ContestType.ABC)),

    /**
     * Single group for ARC 104 onwards
     */
    ARC104Onwards: () =>
      new ContestTableProviderGroup(`ARC 104 Onwards`, {
        buttonLabel: 'ARC 104 〜 ',
        ariaLabel: 'Filter contests from ARC 104 onwards',
      }).addProvider(new ARC104OnwardsProvider(ContestType.ARC)),

    /**
     * Single group for ARC 058-103
     */
    ARC058ToARC103: () =>
      new ContestTableProviderGroup(`ARC 058 To ARC 103`, {
        buttonLabel: 'ARC 058 〜 103',
        ariaLabel: 'Filter contests from ARC 058 to ARC 103',
      }).addProvider(new ARC058ToARC103Provider(ContestType.ARC)),

    /**
     * Single group for ARC 001-057
     */
    ARC001ToARC057: () =>
      new ContestTableProviderGroup(`ARC 001 To ARC 057`, {
        buttonLabel: '旧 ARC',
        ariaLabel: 'Filter contests from ARC 001 to ARC 057',
      }).addProvider(new ARC001ToARC057Provider(ContestType.ARC)),

    /**
     * Single group for AGC 001 onwards
     */
    AGC001Onwards: () =>
      new ContestTableProviderGroup(`AGC 001 Onwards`, {
        buttonLabel: 'AGC 001 〜 ',
        ariaLabel: 'Filter contests from AGC 001 onwards',
      }).addProvider(new AGC001OnwardsProvider(ContestType.AGC)),

    /**
     * Single group for Typical 90 Problems
     */
    Typical90: () =>
      new ContestTableProviderGroup(`競プロ典型 90 問`, {
        buttonLabel: '競プロ典型 90 問',
        ariaLabel: 'Filter Typical 90 Problems',
      }).addProvider(new Typical90Provider(ContestType.TYPICAL90)),

    /**
     * Groups for Tessoku Book
     * Note: Only sectioned providers are registered (examples, practicals, challenges).
     * The base TessokuBookProvider is not registered as it's meant to be subclassed only.
     */
    TessokuBook: () =>
      new ContestTableProviderGroup(`競技プログラミングの鉄則`, {
        buttonLabel: '競技プログラミングの鉄則',
        ariaLabel: 'Filter Tessoku Book',
      }).addProviders(
        new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK),
        new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK),
        new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK),
      ),

    /**
     * Single group for Math and Algorithm Book
     */
    MathAndAlgorithm: () =>
      new ContestTableProviderGroup(`アルゴリズムと数学`, {
        buttonLabel: 'アルゴリズムと数学',
        ariaLabel: 'Filter Math and Algorithm',
      }).addProvider(new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM)),

    /**
     * DP group (EDPC and TDPC)
     */
    dps: () =>
      new ContestTableProviderGroup(`EDPC・TDPC・FPS 24`, {
        buttonLabel: 'EDPC・TDPC・FPS 24',
        ariaLabel: 'EDPC and TDPC and FPS 24 contests',
      }).addProviders(
        new EDPCProvider(ContestType.EDPC),
        new TDPCProvider(ContestType.TDPC),
        new FPS24Provider(ContestType.FPS_24),
      ),

    /**
     * Single group for ACL Practice Contest
     */
    AclPractice: () =>
      new ContestTableProviderGroup(`AtCoder Library Practice Contest`, {
        buttonLabel: 'ACL Practice',
        ariaLabel: 'Filter ACL Practice Contest',
      }).addProvider(new ACLPracticeProvider(ContestType.ACL_PRACTICE)),

    JOIFirstQualRound: () =>
      new ContestTableProviderGroup(`JOI 一次予選`, {
        buttonLabel: 'JOI 一次予選',
        ariaLabel: 'Filter JOI First Qualifying Round',
      }).addProvider(new JOIFirstQualRoundProvider(ContestType.JOI)),

    JOISecondQualAndSemiFinalRound: () =>
      new ContestTableProviderGroup(`JOI 二次予選・予選（旧形式）・本選`, {
        buttonLabel: 'JOI 二次予選・予選（旧形式）・本選',
        ariaLabel: 'Filter JOI Second Qual Round',
      }).addProviders(
        new JOISecondQualRound2020OnwardsProvider(ContestType.JOI),
        new JOIQualRoundFrom2006To2019Provider(ContestType.JOI),
        new JOISemiFinalRoundProvider(ContestType.JOI),
      ),
  };
};

export const contestTableProviderGroups = {
  abs: prepareContestProviderPresets().ABS(),
  abcLatest20Rounds: prepareContestProviderPresets().ABCLatest20Rounds(),
  abc319Onwards: prepareContestProviderPresets().ABC319Onwards(),
  fromAbc212ToAbc318: prepareContestProviderPresets().ABC212ToABC318(),
  fromAbc126ToAbc211: prepareContestProviderPresets().ABC126ToABC211(),
  fromAbc042ToAbc125: prepareContestProviderPresets().ABC042ToABC125(),
  arc104Onwards: prepareContestProviderPresets().ARC104Onwards(),
  fromArc058ToArc103: prepareContestProviderPresets().ARC058ToARC103(),
  agc001Onwards: prepareContestProviderPresets().AGC001Onwards(),
  fromAbc001ToAbc041: prepareContestProviderPresets().ABC001ToABC041(),
  fromArc001ToArc057: prepareContestProviderPresets().ARC001ToARC057(),
  typical90: prepareContestProviderPresets().Typical90(),
  tessokuBook: prepareContestProviderPresets().TessokuBook(),
  mathAndAlgorithm: prepareContestProviderPresets().MathAndAlgorithm(),
  dps: prepareContestProviderPresets().dps(), // Dynamic Programming (DP) Contests
  aclPractice: prepareContestProviderPresets().AclPractice(),
  joiFirstQualRound: prepareContestProviderPresets().JOIFirstQualRound(),
  joiSecondQualAndSemiFinalRound: prepareContestProviderPresets().JOISecondQualAndSemiFinalRound(),
};

export type ContestTableProviderGroups = keyof typeof contestTableProviderGroups;
