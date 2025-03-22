export type ActiveProblemListTab = 'contestTable' | 'listByGrade' | 'gradeGuidelineTable';

export class ActiveProblemListTabStore {
  value = $state<ActiveProblemListTab>('listByGrade');

  /**
   * Creates an instance with the specified contest type.
   *
   * @param activeTab - The default contest type to initialize.
   * Defaults to 'listByGrade'.
   */
  constructor(activeTab: ActiveProblemListTab = 'listByGrade') {
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
   * Sets the internal value to 'listByGrade'.
   */
  reset(): void {
    this.value = 'listByGrade';
  }
}

export const activeProblemListTabStore = new ActiveProblemListTabStore();
