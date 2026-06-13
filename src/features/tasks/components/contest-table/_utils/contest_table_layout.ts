/**
 * Returns Tailwind classes for a table body row based on column count.
 *
 * Rows with more columns than `wrapThreshold` always flex-wrap (xl:table-row suppressed),
 * keeping wide tables readable on desktop. Defaults to 8 columns to match ABC212–ABC318.
 *
 * @param totalColumns - Number of task columns in the row
 * @param wrapThreshold - Column count above which xl:table-row is suppressed (default: 8)
 */
export function getBodyRowClasses(totalColumns: number, wrapThreshold = 8): string {
  return totalColumns > wrapThreshold ? 'flex flex-wrap' : 'flex flex-wrap xl:table-row';
}
