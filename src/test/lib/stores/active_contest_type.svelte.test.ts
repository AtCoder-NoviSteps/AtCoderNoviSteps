import { describe, test, expect, beforeEach } from 'vitest';

import type { ContestTableProviders } from '$lib/utils/contest_table_provider';
import { ActiveContestTypeStore } from '$lib/stores/active_contest_type.svelte';

describe('ActiveContestTypeStore', () => {
  let store: ActiveContestTypeStore;

  beforeEach(() => {
    store = new ActiveContestTypeStore();
  });

  test('expects to initialize with default value', () => {
    expect(store.get()).toBe('abcLatest20Rounds');
  });

  test('expects to return the current value when calling get()', () => {
    expect(store.get()).toBe('abcLatest20Rounds');

    // Change the value and verify get() returns the new value
    store.value = 'abc319Onwards' as ContestTableProviders;
    expect(store.get()).toBe('abc319Onwards');
  });

  test('expects to update the value when calling set()', () => {
    store.set('fromAbc212ToAbc318' as ContestTableProviders);
    expect(store.value).toBe('fromAbc212ToAbc318');
    expect(store.get()).toBe('fromAbc212ToAbc318');

    store.set('abc319Onwards' as ContestTableProviders);
    expect(store.value).toBe('abc319Onwards');
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
});
