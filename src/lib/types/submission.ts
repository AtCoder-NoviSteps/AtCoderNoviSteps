// See:
// https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
export const submissionStatusLabels: Record<string, string> = {
  ns: 'No Sub',
  wa: 'WA',
  ac: 'AC',
} as const;

type SubmissionBase = {
  name: string;
  ratioPercent: number;
};

export interface SubmissionRatio extends SubmissionBase {
  color: string;
}

export type SubmissionRatios = SubmissionRatio[];

export interface SubmissionCount extends SubmissionBase {
  count: number;
}

export type SubmissionCounts = SubmissionCount[];
