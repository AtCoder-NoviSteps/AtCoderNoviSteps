import { type ContestTableProviders } from '$lib/utils/contest_table_provider';

/**
 * Store that manages the active contest type selection.
 *
 * This class uses Svelte's state management to track which contest type
 * is currently active button. It provides methods to get, set, and
 * compare the active contest type.
 *
 * The store uses the ContestTableProviders type which represents
 * different contest table configurations or data providers,
 * with a default value of 'abcLatest20Rounds'.
 */
export class ActiveContestTypeStore {
  value = $state<ContestTableProviders>('abcLatest20Rounds');

  /**
   * Gets the current contest table providers.
   *
   * @returns The current value of contest table providers.
   */
  get(): ContestTableProviders {
    return this.value;
  }

  /**
   * Sets the current contest type to the specified value.
   *
   * @param newContestType - The contest type to set as the current value
   */
  set(newContestType: ContestTableProviders): void {
    this.value = newContestType;
  }

  /**
   * Validates if the current contest type matches the provided contest type.
   * @param contestType - The contest type to compare against
   * @returns `true` if the current contest type matches the provided contest type, `false` otherwise
   */
  isSame(contestType: ContestTableProviders): boolean {
    return this.value === contestType;
  }
}

export const activeContestTypeStore = new ActiveContestTypeStore();
