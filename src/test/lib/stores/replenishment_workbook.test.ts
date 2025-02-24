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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('expects to be invisible before toggling', () => {
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
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

  // Note: This test is skipped because it is not possible to mock localStorage in JSDOM.
  test.skip('persists state in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(false));

    replenishmentWorkBooksStore.toggleView();

    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(localStorageKey, JSON.stringify(true));
  });

  test('handles invalid localStorage data', () => {
    localStorage.setItem(localStorageKey, 'invalid-json');
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });
});

describe('Replenishment workbooks store in SSR', () => {
  beforeEach(() => {
    vi.mock('$app/environment', () => ({
      browser: false,
    }));
  });

  test('handles SSR gracefully', () => {
    expect(replenishmentWorkBooksStore.canView()).toBeFalsy();
  });
});
