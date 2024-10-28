// See:
// https://www.sitepoint.com/delay-sleep-pause-wait/
export function delay(milliseconds: number) {
  if (milliseconds < 0) {
    throw new Error('Delay duration must be non-negative');
  }

  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#get_the_number_of_seconds_since_the_ecmascript_epoch
export const dateToUnixSecond = (date: number | Date | null) => {
  if (date === null) {
    return 0;
  }

  // @ts-ignore
  return Math.floor(date / 1000);
};
