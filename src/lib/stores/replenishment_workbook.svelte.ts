// See:
// https://svelte.dev/docs/kit/$app-environment#browser
import { browser } from '$app/environment';

// See:
// https://svelte.dev/docs/svelte/stores
// https://svelte.dev/docs/svelte/$state
const IS_SHOWN_REPLENISHMENT_WORKBOOKS = 'is_shown_replenishment_workbooks';

class ReplenishmentWorkBooksStore {
  private isShown = $state<boolean>(this.loadInitialState());

  // Note:
  // The $state only manages state in memory and is reset on page reload.
  // In addition, it is not linked to the browser's persistent storage.
  private loadInitialState(): boolean {
    // WHY: Cannot access localStorage during SSR (server-side rendering).
    if (!browser) {
      return false;
    }

    const savedStatus = localStorage.getItem(IS_SHOWN_REPLENISHMENT_WORKBOOKS);
    return savedStatus ? JSON.parse(savedStatus) : false;
  }

  canView() {
    return this.isShown;
  }

  toggleView() {
    this.isShown = !this.isShown;

    if (browser) {
      localStorage.setItem(IS_SHOWN_REPLENISHMENT_WORKBOOKS, JSON.stringify(this.isShown));
    }
  }

  reset() {
    this.isShown = false;
  }
}

export const replenishmentWorkBooksStore = new ReplenishmentWorkBooksStore();
