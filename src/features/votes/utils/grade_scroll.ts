/**
 * Calculates the scrollTop to center the target item within a scrollable container.
 * Returns 0 when dimensions are unavailable (e.g., container not yet visible).
 */
export function calcCenteredScrollTop(
  targetIndex: number,
  scrollHeight: number,
  itemCount: number,
  clientHeight: number,
): number {
  if (itemCount === 0 || scrollHeight === 0) {
    return 0;
  }
  const itemHeight = scrollHeight / itemCount;
  const centered = targetIndex * itemHeight - clientHeight / 2 + itemHeight / 2;
  return Math.max(0, Math.min(scrollHeight - clientHeight, centered));
}
