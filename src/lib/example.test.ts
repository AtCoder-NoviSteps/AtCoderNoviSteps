import { test } from 'vitest';

import { getTasks } from '$lib/clients';

test('call problems api', () => {
  getTasks();
});
