// See:
// https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
export const submissionStatusLabels: Record<string, string> = {
  ns: 'No Sub',
  wa: 'WA',
  ac: 'AC',
} as const;
