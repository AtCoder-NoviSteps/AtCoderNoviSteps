import { describe, test, expect, vi, beforeEach } from 'vitest';

import {
  activeProblemListTabStore,
  ActiveProblemListTabStore,
} from '$lib/stores/active_problem_list_tab.svelte';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('ActiveProblemListTabStore', () => {
  let store: ActiveProblemListTabStore;

  const mockLocalStorage: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock for localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);

    store = new ActiveProblemListTabStore();
    store.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    test('expects to initialize with default value', () => {
      expect(store.get()).toBe('contestTable');
    });

    test('expects to initialize with provided value', () => {
      const customStore = new ActiveProblemListTabStore('listByGrade');
      expect(customStore.get()).toBe('listByGrade');
    });
  });

  describe('get', () => {
    test('expects to return the current active tab', () => {
      expect(store.get()).toBe('contestTable');
    });
  });

  describe('set', () => {
    test('expects to update the active tab value', () => {
      store.set('listByGrade');
      expect(store.get()).toBe('listByGrade');

      store.set('gradeGuidelineTable');
      expect(store.get()).toBe('gradeGuidelineTable');
    });
  });

  describe('isSame', () => {
    test('expects to return true when active tab matches the argument', () => {
      store.set('listByGrade');
      expect(store.isSame('listByGrade')).toBe(true);
    });

    test('expects to return false when active tab does not match the argument', () => {
      store.set('listByGrade');
      expect(store.isSame('contestTable')).toBe(false);
      expect(store.isSame('gradeGuidelineTable')).toBe(false);
    });
  });

  describe('reset', () => {
    test('expects to reset the active tab to the default value', () => {
      store.set('listByGrade');
      expect(store.get()).toBe('listByGrade');

      store.reset();
      expect(store.get()).toBe('contestTable');
    });
  });
});

describe('Active problem list tab store in SSR', () => {
  beforeEach(() => {
    vi.mock('$app/environment', () => ({
      browser: false,
    }));
  });

  test('handles SSR gracefully', () => {
    expect(activeProblemListTabStore.get()).toBe('contestTable');
  });
});
