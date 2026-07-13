// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  replenishmentWorkBooksStore,
  ReplenishmentWorkBooksStore,
} from '$features/workbooks/stores/replenishment_workbook.svelte';

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

const localStorageKey = 'is_shown_replenishment_workbooks';

afterEach(() => {
  localStorage.clear();
});

describe('Replenishment workbooks store', () => {
  beforeEach(() => {
    browserState.value = true;
    localStorage.clear();

    replenishmentWorkBooksStore.reset();
  });

  test('expects to be invisible before toggling', () => {
    expect(replenishmentWorkBooksStore.canView()).toBe(false);
  });

  test.each([
    { toggles: 1, expected: true },
    { toggles: 2, expected: false },
    { toggles: 3, expected: true },
    { toggles: 4, expected: false },
  ])('expects to be $expected after toggling $toggles times', ({ toggles, expected }) => {
    for (let i = 1; i <= toggles; i++) {
      replenishmentWorkBooksStore.toggleView();
    }
    expect(replenishmentWorkBooksStore.canView()).toBe(expected);
  });

  test('expects to persist state in localStorage', () => {
    replenishmentWorkBooksStore.toggleView();
    expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify(true));

    replenishmentWorkBooksStore.toggleView();
    expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify(false));
  });

  test('expects to be invisible when localStorage holds no state', () => {
    expect(new ReplenishmentWorkBooksStore().canView()).toBe(false);
  });

  test('expects to restore the state persisted in localStorage', () => {
    localStorage.setItem(localStorageKey, JSON.stringify(true));

    expect(new ReplenishmentWorkBooksStore().canView()).toBe(true);
  });

  test('expects to be invisible when localStorage data is invalid', () => {
    localStorage.setItem(localStorageKey, 'invalid-json');

    expect(new ReplenishmentWorkBooksStore().canView()).toBe(false);
  });
});

describe('Replenishment workbooks store in SSR', () => {
  beforeEach(() => {
    browserState.value = false;
  });

  test('expects to ignore localStorage and be invisible', () => {
    localStorage.setItem(localStorageKey, JSON.stringify(true));

    expect(new ReplenishmentWorkBooksStore().canView()).toBe(false);
  });

  test('expects not to persist state in localStorage when toggling', () => {
    const store = new ReplenishmentWorkBooksStore();
    store.toggleView();

    expect(store.canView()).toBe(true);
    expect(localStorage.getItem(localStorageKey)).toBeNull();
  });
});
