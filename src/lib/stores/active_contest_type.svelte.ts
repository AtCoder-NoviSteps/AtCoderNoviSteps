import { useLocalStorage } from '$lib/stores/local_storage_helper.svelte';
import {
  type ContestTableProviderGroups,
  contestTableProviderGroups,
} from '$lib/utils/contest_table_provider';

/**
 * Store that manages the active contest type selection.
 *
 * This class uses Svelte's state management to track which contest type
 * is currently active button. It provides methods to get, set, and
 * compare the active contest type.
 *
 * The store uses the ContestTableProviderGroups type which represents
 * different contest table configurations or data providers,
 * with a default value of 'abs'.
 */
export class ActiveContestTypeStore {
  private storage = useLocalStorage<ContestTableProviderGroups>('contest_table_providers', 'abs');

  /**
   * Creates an instance with the specified contest type.
   *
   * @param defaultContestType - The default contest type to initialize.
   * Defaults to 'abs'.
   */
  constructor(defaultContestType: ContestTableProviderGroups = 'abs') {
    if (!this.isValidContestType(this.storage.value)) {
      this.storage.value = defaultContestType;
    }
  }

  /**
   * Validates if the provided contest type exists in contestTableProviderGroups.
   *
   * @param contestType - The contest type to validate
   * @returns `true` if the contest type is valid, `false` otherwise
   */
  private isValidContestType(contestType: ContestTableProviderGroups | null | undefined): boolean {
    return (
      contestType !== null &&
      contestType !== undefined &&
      Object.keys(contestTableProviderGroups).includes(contestType)
    );
  }

  /**
   * Gets the current contest table providers.
   *
   * @returns The current value of contest table providers.
   */
  get(): ContestTableProviderGroups {
    return this.storage.value;
  }

  /**
   * Sets the current contest type to the specified value.
   *
   * @param newContestType - The contest type to set as the current value
   */
  set(newContestType: ContestTableProviderGroups): void {
    this.storage.value = newContestType;
  }

  /**
   * Validates if the current contest type matches the provided contest type.
   * @param contestType - The contest type to compare against
   * @returns `true` if the current contest type matches the provided contest type, `false` otherwise
   */
  isSame(contestType: ContestTableProviderGroups): boolean {
    return this.storage.value === contestType;
  }

  /**
   * Resets the active contest type to the default value.
   * Sets the internal value to 'abs'.
   */
  reset(): void {
    this.storage.value = 'abs';
  }
}

let instance: ActiveContestTypeStore | null = null;

export function getActiveContestTypeStore(): ActiveContestTypeStore {
  if (!instance) {
    instance = new ActiveContestTypeStore();
  }

  return instance;
}

// Export the singleton instance of the store.
export const activeContestTypeStore = getActiveContestTypeStore();
