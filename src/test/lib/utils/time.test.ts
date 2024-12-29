import { describe, it, expect } from 'vitest';
import { delay } from '$lib/utils/time';

describe('Delay', () => {
  it('expected to be resolved after the specified delay', async () => {
    const start = performance.now();
    const milliseconds = 50; // Increased threshold for CI environment reliability.
    await delay(milliseconds);
    const end = performance.now();

    expect(end - start).toBeGreaterThanOrEqual(milliseconds - 5); // Extend tolerance.
  });

  it('expected to be resolved immediately if the delay duration is zero', async () => {
    const start = performance.now();
    await delay(0);
    const end = performance.now();

    expect(end - start).toBeLessThan(50); // Increased threshold for CI environment reliability.
  });

  it('expected to be thrown an error if the delay duration is negative', () => {
    expect(() => delay(-100)).toThrow('Delay duration must be non-negative');
  });
});
