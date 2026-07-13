// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ContestTableProviderGroups } from '$features/tasks/utils/contest-table/contest_table_provider';
import {
  activeContestTypeStore,
  ActiveContestTypeStore,
} from '$features/tasks/stores/active_contest_type.svelte';

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

const localStorageKey = 'contest_table_providers';

afterEach(() => {
  localStorage.clear();
});

describe('ActiveContestTypeStore', () => {
  let store: ActiveContestTypeStore;

  beforeEach(() => {
    browserState.value = true;
    localStorage.clear();

    store = new ActiveContestTypeStore();
    store.reset();
  });

  test('expects to initialize with default value', () => {
    expect(store.get()).toBe('abs');
  });

  test('expects to return the current value when calling get()', () => {
    expect(store.get()).toBe('abs');

    // Change the value and verify get() returns the new value
    store.set('abc319Onwards' as ContestTableProviderGroups);
    expect(store.get()).toBe('abc319Onwards');
  });

  test('expects to update the value when calling set()', () => {
    store.set('fromAbc212ToAbc318' as ContestTableProviderGroups);
    expect(store.get()).toBe('fromAbc212ToAbc318');

    store.set('abc319Onwards' as ContestTableProviderGroups);
    expect(store.get()).toBe('abc319Onwards');
  });

  test('expects to persist the value in localStorage when calling set()', () => {
    store.set('abc319Onwards' as ContestTableProviderGroups);
    expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify('abc319Onwards'));
  });

  test('expects to restore the value persisted in localStorage', () => {
    localStorage.setItem(localStorageKey, JSON.stringify('fromAbc212ToAbc318'));

    expect(new ActiveContestTypeStore().get()).toBe('fromAbc212ToAbc318');
  });

  test('expects to correctly determine if contest type is the same with isSame()', () => {
    expect(store.isSame('abs' as ContestTableProviderGroups)).toBe(true);
    expect(store.isSame('abc319Onwards' as ContestTableProviderGroups)).toBe(false);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviderGroups)).toBe(false);

    store.set('abc319Onwards' as ContestTableProviderGroups);
    expect(store.isSame('abc319Onwards' as ContestTableProviderGroups)).toBe(true);
    expect(store.isSame('abs' as ContestTableProviderGroups)).toBe(false);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviderGroups)).toBe(false);

    store.set('fromAbc212ToAbc318' as ContestTableProviderGroups);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviderGroups)).toBe(true);
    expect(store.isSame('abs' as ContestTableProviderGroups)).toBe(false);
    expect(store.isSame('abc319Onwards' as ContestTableProviderGroups)).toBe(false);
  });

  test('expects to reset the value to default when calling reset()', () => {
    // First change the value to something else
    store.set('abc319Onwards' as ContestTableProviderGroups);
    expect(store.get()).toBe('abc319Onwards');

    // Call reset and verify it goes back to default
    store.reset();
    expect(store.get()).toBe('abs');

    // Change to a different value and reset again to verify consistency
    store.set('fromAbc212ToAbc318' as ContestTableProviderGroups);
    expect(store.get()).toBe('fromAbc212ToAbc318');

    store.reset();
    expect(store.get()).toBe('abs');
  });

  test('expects to reset to default when initialized with invalid localStorage key', () => {
    localStorage.setItem(localStorageKey, JSON.stringify('invalidContestType'));

    const newStore = new ActiveContestTypeStore();
    expect(newStore.get()).toBe('abs');
  });

  test('expects to reset to default when localStorage holds invalid JSON', () => {
    localStorage.setItem(localStorageKey, 'invalid-json');

    const newStore = new ActiveContestTypeStore();
    expect(newStore.get()).toBe('abs');
  });

  test('expects to reset to default when initialized with null', () => {
    localStorage.setItem(localStorageKey, JSON.stringify(null));

    const newStore = new ActiveContestTypeStore();
    expect(newStore.get()).toBe('abs');
  });

  test('expects to handle multiple contest type changes', () => {
    const types: ContestTableProviderGroups[] = [
      'abc319Onwards' as ContestTableProviderGroups,
      'fromAbc212ToAbc318' as ContestTableProviderGroups,
      'abs' as ContestTableProviderGroups,
    ];

    types.forEach((type) => {
      store.set(type);
      expect(store.get()).toBe(type);
    });
  });
});

describe('Active contest type store in SSR', () => {
  beforeEach(() => {
    browserState.value = false;
  });

  test('expects to ignore localStorage and initialize with default value', () => {
    localStorage.setItem(localStorageKey, JSON.stringify('abc319Onwards'));

    expect(new ActiveContestTypeStore().get()).toBe('abs');
  });

  test('expects not to persist the value in localStorage when calling set()', () => {
    const store = new ActiveContestTypeStore();
    store.set('abc319Onwards' as ContestTableProviderGroups);

    expect(store.get()).toBe('abc319Onwards');
    expect(localStorage.getItem(localStorageKey)).toBeNull();
  });

  test('expects the singleton constructed at import time to hold the default value', () => {
    expect(activeContestTypeStore.get()).toBe('abs');
  });
});
