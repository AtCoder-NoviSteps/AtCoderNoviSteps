import { writable } from 'svelte/store';

import { WorkBookType } from '$lib/types/workbook';

const workBookTypes = Object.values(WorkBookType) as Array<WorkBookType>;
// Map<WorkBookType, IsActiveWorkBookTab>
const initialValues = new Map<WorkBookType, boolean>(
  workBookTypes.map((workBookType: WorkBookType) => [workBookType, false]),
);
initialValues.set(WorkBookType.CURRICULUM, true);

function createActiveWorkbookTabStore() {
  const { subscribe, update } = writable(initialValues);

  return {
    subscribe,
    setActiveWorkbookTab: (activeWorkBookTab: WorkBookType) =>
      update((currentValues) => {
        const newValues = new Map(currentValues);
        newValues.forEach((_, workBookType) => {
          newValues.set(workBookType, workBookType === activeWorkBookTab);
        });

        return newValues;
      }),
  };
}

export const activeWorkbookTabStore = createActiveWorkbookTabStore();
