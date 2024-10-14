import { test } from 'vitest';

import { getTasks } from '$lib/clients/atcoder_problems';

test('call problems api', () => {
  getTasks();
});
