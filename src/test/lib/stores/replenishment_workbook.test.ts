import { expect, test } from 'vitest';

import { replenishmentWorkBooksStore } from '$lib/stores/replenishment_workbook.svelte';

describe('Replenishment workbooks store', () => {
  beforeEach(() => {
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
});
