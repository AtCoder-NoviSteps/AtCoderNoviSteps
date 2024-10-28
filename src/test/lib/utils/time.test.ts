import { describe, it, expect } from 'vitest';
import { delay } from '$lib/utils/time';

describe('Delay', () => {
  it('expected to be resolved after the specified delay', async () => {
    const start = Date.now();
    const milliseconds = 100;
    await delay(milliseconds);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(milliseconds);
  });

  it('expected to be thrown an error if the delay duration is negative', () => {
    expect(() => delay(-100)).toThrow('Delay duration must be non-negative');
  });

  it('expected to be resolved immediately if the delay duration is zero', async () => {
    const start = Date.now();
    await delay(0);
    const end = Date.now();

    expect(end - start).toBeLessThan(10); // Allowing a small margin for execution time.
  });
});
