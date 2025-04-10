import { useLocalStorage } from '$lib/stores/local_storage_helper.svelte';
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
  private storage = useLocalStorage<ContestTableProviders>(
    'contest_table_providers',
    'abcLatest20Rounds',
  );

  /**
   * Creates an instance with the specified contest type.
   *
   * @param defaultContestType - The default contest type to initialize.
   * Defaults to 'abcLatest20Rounds'.
   */
  constructor(defaultContestType: ContestTableProviders = 'abcLatest20Rounds') {
    if (defaultContestType !== 'abcLatest20Rounds' || !this.storage.value) {
      this.storage.value = defaultContestType;
    }
  }

  /**
   * Gets the current contest table providers.
   *
   * @returns The current value of contest table providers.
   */
  get(): ContestTableProviders {
    return this.storage.value;
  }

  /**
   * Sets the current contest type to the specified value.
   *
   * @param newContestType - The contest type to set as the current value
   */
  set(newContestType: ContestTableProviders): void {
    this.storage.value = newContestType;
  }

  /**
   * Validates if the current contest type matches the provided contest type.
   * @param contestType - The contest type to compare against
   * @returns `true` if the current contest type matches the provided contest type, `false` otherwise
   */
  isSame(contestType: ContestTableProviders): boolean {
    return this.storage.value === contestType;
  }

  /**
   * Resets the active contest type to the default value.
   * Sets the internal value to 'abcLatest20Rounds'.
   */
  reset(): void {
    this.storage.value = 'abcLatest20Rounds';
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
