/**
 * Calculates the scrollTop to center the target item within a scrollable container.
 * Returns 0 when dimensions are unavailable (e.g., container not yet visible).
 *
 * @param targetIndex - 0-based index of the item to center
 * @param scrollHeight - element.scrollHeight (DOM API): total height of all items
 * @param clientHeight - element.clientHeight (DOM API): visible height of the container
 *
 * Layout:
 *
 *  ┌──────────────────┐ ─── 0
 *  │  item 0          │
 *  │  item 1          │ ─── scrollTop ───────────────────────┐
 *  │  item 2          │                                      │ clientHeight
 *  │  item 3 (target) │ ─── item center (align here)         │ (visible)
 *  │  item 4          │                                      │
 *  │  item 5          │ ─── scrollTop + clientHeight ────────┘
 *  │  ...             │
 *  └──────────────────┘ ─── scrollHeight
 *
 * Centering condition:
 *   scrollTop + clientHeight / 2 = targetIndex * itemHeight + itemHeight / 2
 *   → scrollTop = targetIndex * itemHeight - clientHeight / 2 + itemHeight / 2
 */
export function calcCenteredScrollTop(
  itemCount: number,
  targetIndex: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  if (itemCount === 0 || scrollHeight === 0) {
    return 0;
  }

  const itemHeight = scrollHeight / itemCount;
  const centered = targetIndex * itemHeight - clientHeight / 2 + itemHeight / 2;

  // Clamp between 0 (top of list) and scrollHeight - clientHeight (bottom of list)
  return Math.max(0, Math.min(scrollHeight - clientHeight, centered));
}
