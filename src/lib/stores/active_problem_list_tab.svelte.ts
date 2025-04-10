import { useLocalStorage } from '$lib/stores/local_storage_helper.svelte';

export type ActiveProblemListTab = 'contestTable' | 'listByGrade' | 'gradeGuidelineTable';

export class ActiveProblemListTabStore {
  private storage = useLocalStorage<ActiveProblemListTab>(
    'active_problem_list_tab',
    'contestTable',
  );

  /**
   * Creates an instance with the specified problem list tab.
   *
   * @param activeTab - The default problem list tab to initialize.
   * Defaults to 'contestTable'.
   */
  constructor(activeTab: ActiveProblemListTab = 'contestTable') {
    if (activeTab !== 'contestTable' || !this.storage.value) {
      this.storage.value = activeTab;
    }
  }

  /**
   * Gets the current active tab.
   *
   * @returns The current active tab.
   */
  get(): ActiveProblemListTab {
    return this.storage.value;
  }

  /**
   * Sets the current tab to the specified value.
   *
   * @param activeTab - The active tab to set as the current value
   */
  set(activeTab: ActiveProblemListTab): void {
    this.storage.value = activeTab;
  }

  /**
   * Validates if the current tab matches the task list.
   * @param activeTab - The active tab to compare against
   * @returns `true` if the active tab matches the task list, `false` otherwise
   */
  isSame(activeTab: ActiveProblemListTab): boolean {
    return this.storage.value === activeTab;
  }

  /**
   * Resets the active tab to the default value.
   * Sets the internal value to 'contestTable'.
   */
  reset(): void {
    this.storage.value = 'contestTable';
  }
}

let instance: ActiveProblemListTabStore | null = null;

export function getActiveProblemListTabStore(): ActiveProblemListTabStore {
  if (!instance) {
    instance = new ActiveProblemListTabStore();
  }

  return instance;
}

// Export the singleton instance of the store.
export const activeProblemListTabStore = getActiveProblemListTabStore();
