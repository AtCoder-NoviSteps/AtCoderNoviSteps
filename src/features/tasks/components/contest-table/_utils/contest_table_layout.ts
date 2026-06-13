// Rows with more columns than wrapThreshold always flex-wrap (xl:table-row suppressed).
// Default 8 matches ABC212–ABC318 (8 tasks per contest).
export function getBodyRowClasses(totalColumns: number, wrapThreshold = 8): string {
  return totalColumns > wrapThreshold ? 'flex flex-wrap' : 'flex flex-wrap xl:table-row';
}
