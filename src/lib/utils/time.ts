// See:
// https://www.sitepoint.com/delay-sleep-pause-wait/
export function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
