import type { ContestType } from '$lib/types/contest';
import type { TaskResults, TaskResult } from '$lib/types/task';

/**
 * Provider interface for building and managing contest tables.
 *
 * This interface defines the contract for components that create, filter, and
 * generate contest tables from task results.
 *
 */
export interface ContestTableProvider {
  /**
   * Filters the provided task results according to implementation-specific criteria.
   *
   * @param {TaskResults} taskResults - The original task results to be filtered
   * @returns {TaskResults} The filtered task results
   */
  filter(taskResults: TaskResults): TaskResults;

  /**
   * Generates a contest table based on the provided filtered task results.
   *
   * @param {TaskResults} filteredTaskResults - The filtered task results to use for table generation
   * @returns {ContestTable} The generated contest table
   */
  generateTable(filteredTaskResults: TaskResults): ContestTable;

  /**
   * Retrieves the unique identifiers for all contest rounds.
   *
   * @param {TaskResults} filteredTaskResults - The filtered task results to use for table generation
   * @returns {Array<string>} An array of contest round identifiers.
   */
  getContestRoundIds(filteredTaskResults: TaskResults): Array<string>;

  /**
   * Retrieves an array of header IDs associated with the current contest tasks.
   * These IDs are used to identify and display the relevant columns in the task table.
   *
   * @param {TaskResults} filteredTaskResults - The filtered task results to use for table generation
   * @returns {Array<string>} An array of string IDs corresponding to the header columns for the task.
   */
  getHeaderIdsForTask(filteredTaskResults: TaskResults): Array<string>;

  /**
   * Retrieves metadata associated with the contest table.
   *
   * @returns {ContestTableMetaData} Metadata for the contest table
   */
  getMetadata(): ContestTableMetaData;

  /**
   * Returns the display configuration for the contest table.
   */
  getDisplayConfig(): ContestTableDisplayConfig;

  /**
   * Returns a formatted label for the contest round.
   *
   * This abstract method must be implemented by subclasses to provide
   * a string representation of the contest round that can be displayed
   * in the task table.
   *
   * @param contestId - The ID of the contest.
   *
   * @returns {string} The formatted label string for the contest round.
   */
  getContestRoundLabel(contestId: string): string;
}

/**
 * Type for provider key
 * Supports simple contest type keys (e.g., 'ABC') and complex keys with sections
 * (e.g., 'TESSOKU_BOOK::examples', 'TESSOKU_BOOK::practicals', 'TESSOKU_BOOK::challenges')
 */
export type ProviderKey = `${ContestType}` | `${ContestType}::${string}`;

/**
 * Sections for contest type in provider key
 */
export const TESSOKU_SECTIONS = {
  EXAMPLES: 'examples',
  PRACTICALS: 'practicals',
  CHALLENGES: 'challenges',
} as const;

export const JOI_SECOND_QUAL_ROUND_SECTIONS = {
  '2020Onwards': '2020Onwards',
  from2006To2019: 'from2006To2019',
} as const;

export const JOI_FINAL_ROUND_SECTIONS = {
  semiFinal: 'semiFinal',
} as const;

/**
 * Represents a two-dimensional table of contest results.
 *
 * The structure is organized as a nested record:
 * - The outer keys represent contest id
 * - The inner keys represent task id
 * - The values are the results for each task
 *
 * @example
 * {
 *   "abc396": {
 *     "abc396_a": {contest_id: "abc396", task_id: "abc396_a", status_name: "ac", ...},
 *     "abc396_b": {contest_id: "abc396", task_id: "abc396_b", status_name: "ac", ...},
 *     "abc396_c": {contest_id: "abc396", task_id: "abc396_c", status_name: "ac_with_editorial", ...},
 *     ...,
 *     "abc396_g": {contest_id: "abc396", task_id: "abc396_g", status_name: "wa", ...},
 *   },
 *   "abc395": {
 *     "abc395_a": {contest_id: "abc395", task_id: "abc395_a", status_name: "ac", ...},
 *     "abc395_b": {contest_id: "abc395", task_id: "abc395_b", status_name: "ac", ...},
 *     "abc395_c": {contest_id: "abc395", task_id: "abc395_c", status_name: "ac", ...},
 *     ...,
 *     "abc395_g": {contest_id: "abc395", task_id: "abc395_g", status_name: "wa", ...},
 *   },
 * }
 */
export type ContestTable = Record<string, Record<string, TaskResult>>;

/**
 * Metadata for configuring a contest table's display properties.
 *
 * @typedef {Object} ContestTableMetaData
 * @property {string} title - The title text to display for the contest table.
 * @property {string} abbreviationName - Contest abbreviation, used for map keys.
 */
export type ContestTableMetaData = {
  title: string;
  abbreviationName: string;
};

/**
 * Metadata configuration for contest table UI components.
 *
 * @typeof {Object} ContestTablesMetaData
 * @property {string} buttonLabel - The text to display on the contest table's primary action button.
 * @property {string} ariaLabel - Accessibility label for screen readers describing the contest table.
 */
export type ContestTablesMetaData = {
  buttonLabel: string;
  ariaLabel: string;
};

/**
 * Configuration object that controls the display behavior of contest table components.
 *
 * @interface ContestTableDisplayConfig
 * @property {boolean} isShownHeader - Whether to display the table header
 * @property {boolean} isShownRoundLabel - Whether to display round labels in the contest table
 * @property {string} roundLabelWidth - tailwind CSS width for the round label column, e.g., "xl:w-16" or "xl:w-20"
 * @property {string} tableBodyCellsWidth - tailwind CSS width for the table body cells, e.g., "w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1"
 * @property {boolean} isShownTaskIndex - Whether to display task index in the contest table cells
 */
export interface ContestTableDisplayConfig {
  isShownHeader: boolean;
  isShownRoundLabel: boolean;
  roundLabelWidth: string;
  tableBodyCellsWidth: string;
  isShownTaskIndex: boolean;
}
