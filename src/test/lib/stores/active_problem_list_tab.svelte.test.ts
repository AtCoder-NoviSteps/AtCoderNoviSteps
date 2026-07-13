// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  activeProblemListTabStore,
  ActiveProblemListTabStore,
} from '$lib/stores/active_problem_list_tab.svelte';

// WHY: a single dynamic mock is the only way to toggle `browser` per describe. Every vi.mock is
// hoisted and the last registration for a module wins, so a second vi.mock of `$app/environment`
// would silently clamp the whole file to one branch.
// Defaults to false so the singleton constructed at import time stays SSR-safe (no localStorage).
const browserState = vi.hoisted(() => ({ value: false }));

vi.mock('$app/environment', () => ({
  get browser() {
    return browserState.value;
  },
}));

const localStorageKey = 'active_problem_list_tab';

afterEach(() => {
  localStorage.clear();
});

describe('ActiveProblemListTabStore', () => {
  let store: ActiveProblemListTabStore;

  beforeEach(() => {
    browserState.value = true;
    localStorage.clear();

    store = new ActiveProblemListTabStore();
    store.reset();
  });

  describe('constructor', () => {
    test('expects to initialize with default value', () => {
      expect(store.get()).toBe('contestTable');
    });

    test('expects to initialize with provided value', () => {
      const customStore = new ActiveProblemListTabStore('listByGrade');
      expect(customStore.get()).toBe('listByGrade');
    });

    test('expects to restore the value persisted in localStorage', () => {
      localStorage.setItem(localStorageKey, JSON.stringify('gradeGuidelineTable'));

      expect(new ActiveProblemListTabStore().get()).toBe('gradeGuidelineTable');
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

    test('expects to persist the active tab in localStorage', () => {
      store.set('listByGrade');
      expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify('listByGrade'));
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
    browserState.value = false;
  });

  test('expects to ignore localStorage and initialize with default value', () => {
    localStorage.setItem(localStorageKey, JSON.stringify('listByGrade'));

    expect(new ActiveProblemListTabStore().get()).toBe('contestTable');
  });

  test('expects the singleton constructed at import time to hold the default value', () => {
    expect(activeProblemListTabStore.get()).toBe('contestTable');
  });
});
