import { describe, test, expect, vi, beforeEach } from 'vitest';

import type { ContestTableProviders } from '$lib/utils/contest_table_provider';
import {
  activeContestTypeStore,
  ActiveContestTypeStore,
} from '$lib/stores/active_contest_type.svelte';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('ActiveContestTypeStore', () => {
  let store: ActiveContestTypeStore;

  const mockLocalStorage: Storage = {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock for localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);

    store = new ActiveContestTypeStore();
    store.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('expects to initialize with default value', () => {
    expect(store.get()).toBe('abcLatest20Rounds');
  });

  test('expects to initialize with provided value', () => {
    const customStore = new ActiveContestTypeStore('abc319Onwards' as ContestTableProviders);
    expect(customStore.get()).toBe('abc319Onwards');
  });

  test('expects to return the current value when calling get()', () => {
    expect(store.get()).toBe('abcLatest20Rounds');

    // Change the value and verify get() returns the new value
    store.set('abc319Onwards' as ContestTableProviders);
    expect(store.get()).toBe('abc319Onwards');
  });

  test('expects to update the value when calling set()', () => {
    store.set('fromAbc212ToAbc318' as ContestTableProviders);
    expect(store.get()).toBe('fromAbc212ToAbc318');

    store.set('abc319Onwards' as ContestTableProviders);
    expect(store.get()).toBe('abc319Onwards');
  });

  test('expects to correctly determine if contest type is the same with isSame()', () => {
    expect(store.isSame('abcLatest20Rounds' as ContestTableProviders)).toBe(true);
    expect(store.isSame('abc319Onwards' as ContestTableProviders)).toBe(false);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviders)).toBe(false);

    store.set('abc319Onwards' as ContestTableProviders);
    expect(store.isSame('abc319Onwards' as ContestTableProviders)).toBe(true);
    expect(store.isSame('abcLatest20Rounds' as ContestTableProviders)).toBe(false);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviders)).toBe(false);

    store.set('fromAbc212ToAbc318' as ContestTableProviders);
    expect(store.isSame('fromAbc212ToAbc318' as ContestTableProviders)).toBe(true);
    expect(store.isSame('abcLatest20Rounds' as ContestTableProviders)).toBe(false);
    expect(store.isSame('abc319Onwards' as ContestTableProviders)).toBe(false);
  });

  test('expects to reset the value to default when calling reset()', () => {
    // First change the value to something else
    store.set('abc319Onwards' as ContestTableProviders);
    expect(store.get()).toBe('abc319Onwards');

    // Call reset and verify it goes back to default
    store.reset();
    expect(store.get()).toBe('abcLatest20Rounds');

    // Change to a different value and reset again to verify consistency
    store.set('fromAbc212ToAbc318' as ContestTableProviders);
    expect(store.get()).toBe('fromAbc212ToAbc318');

    store.reset();
    expect(store.get()).toBe('abcLatest20Rounds');
  });
});

describe('Active contest type store in SSR', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mock('$app/environment', () => ({
      browser: false,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('handles SSR gracefully', () => {
    expect(activeContestTypeStore.get()).toBe('abcLatest20Rounds');
  });
});
