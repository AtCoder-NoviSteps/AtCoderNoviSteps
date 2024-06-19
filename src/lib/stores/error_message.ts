import { writable } from 'svelte/store';

function createErrorMessageStore() {
  const { subscribe, set } = writable<string | null>(null);

  return {
    subscribe,
    setAndClearAfterTimeout: (value: string | null, timeoutInMilliSeconds = 3000) => {
      set(value);
      setTimeout(() => set(null), timeoutInMilliSeconds);
    },
  };
}

export const errorMessageStore = createErrorMessageStore();
