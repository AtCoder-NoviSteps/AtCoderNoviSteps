// See:
// https://www.sitepoint.com/delay-sleep-pause-wait/
export function delay(milliseconds: number) {
  if (milliseconds < 0) {
    throw new Error('Delay duration must be non-negative');
  }

  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
