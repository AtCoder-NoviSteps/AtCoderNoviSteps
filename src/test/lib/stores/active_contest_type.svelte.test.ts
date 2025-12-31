import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ContestTableProviderGroups } from '$lib/utils/contest_table_provider';
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
    // Clear mockStorage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    // Setup mock for localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);

    store = new ActiveContestTypeStore();
    store.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    // Simulate invalid key in localStorage
    mockStorage['contest_table_providers'] = JSON.stringify('invalidContestType');

    const newStore = new ActiveContestTypeStore();
    expect(newStore.get()).toBe('abs');
  });

  test('expects to reset to default when initialized with null', () => {
    mockStorage['contest_table_providers'] = JSON.stringify(null);

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
    vi.restoreAllMocks();
    vi.mock('$app/environment', () => ({
      browser: false,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('handles SSR gracefully', () => {
    expect(activeContestTypeStore.get()).toBe('abs');
  });
});
