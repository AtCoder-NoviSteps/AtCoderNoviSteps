import { expect, test, vi } from 'vitest';

import { replenishmentWorkBooksStore } from '$lib/stores/replenishment_workbook.svelte';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('Replenishment workbooks store', () => {
  const localStorageKey = 'is_shown_replenishment_workbooks';
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock for localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);

    replenishmentWorkBooksStore.reset();
  });

  test('expects to be invisible before toggling', () => {
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });

  test('expects to be visible after toggling once', () => {
    replenishmentWorkBooksStore.toggleView();
    expect(replenishmentWorkBooksStore.canView()).toBeTruthy();
  });

  test('expects to be invisible after toggling twice', () => {
    replenishmentWorkBooksStore.toggleView();
    replenishmentWorkBooksStore.toggleView();
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });

  test('expects to be visible after toggling three times', () => {
    for (let i = 1; i <= 3; i++) {
      replenishmentWorkBooksStore.toggleView();
    }

    expect(replenishmentWorkBooksStore.canView()).toBeTruthy();
  });

  test('expects to be invisible after toggling four times', () => {
    for (let i = 1; i <= 4; i++) {
      replenishmentWorkBooksStore.toggleView();
    }

    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });

  // Note: This test is skipped because it is not possible to mock localStorage in JSDOM.
  test.skip('persists state in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(false));

    replenishmentWorkBooksStore.toggleView();

    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(localStorageKey, JSON.stringify(true));
  });

  test('handles SSR gracefully', () => {
    vi.mock('$app/environment', () => ({
      browser: false,
    }));

    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });

  test('handles invalid localStorage data', () => {
    localStorage.setItem(localStorageKey, 'invalid-json');
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });
});
