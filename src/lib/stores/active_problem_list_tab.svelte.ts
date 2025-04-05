export type ActiveProblemListTab = 'contestTable' | 'listByGrade' | 'gradeGuidelineTable';

export class ActiveProblemListTabStore {
  value = $state<ActiveProblemListTab>('contestTable');

  /**
   * Creates an instance with the specified problem list tab.
   *
   * @param activeTab - The default problem list tab to initialize.
   * Defaults to 'contestTable'.
   */
  constructor(activeTab: ActiveProblemListTab = 'contestTable') {
    this.value = activeTab;
  }

  /**
   * Gets the current active tab.
   *
   * @returns The current active tab.
   */
  get(): ActiveProblemListTab {
    return this.value;
  }

  /**
   * Sets the current tab to the specified value.
   *
   * @param activeTab - The active tab to set as the current value
   */
  set(activeTab: ActiveProblemListTab): void {
    this.value = activeTab;
  }

  /**
   * Validates if the current tab matches the task list.
   * @param activeTab - The active tab to compare against
   * @returns `true` if the active tab matches the task list, `false` otherwise
   */
  isSame(activeTab: ActiveProblemListTab): boolean {
    return this.value === activeTab;
  }

  /**
   * Resets the active tab to the default value.
   * Sets the internal value to 'contestTable'.
   */
  reset(): void {
    this.value = 'contestTable';
  }
}

export const activeProblemListTabStore = new ActiveProblemListTabStore();
