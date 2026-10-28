export const NO_JUDGE_TASK_ID_PREFIX = 'NoJudge-';

export function isNoJudgeTask(taskId: string): boolean {
  return taskId.startsWith(NO_JUDGE_TASK_ID_PREFIX);
}

type NoJudgePage = { url: string; taskIds: string[] };

// Tasks missing from AOJ link to the jag-icpc.org page of their event, where the statements, judge data and reviews live.
// Urls are pasted as opened in a browser, percent-encoded.
const NO_JUDGE_PAGES: NoJudgePage[] = [
  {
    url: 'https://jag-icpc.org/?2006%2FPractice%2F%E5%A4%8F%E5%90%88%E5%AE%BF',
    taskIds: [
      'NoJudge-JAGSummer2006-day1_a',
      'NoJudge-JAGSummer2006-day1_c',
      'NoJudge-JAGSummer2006-day3_a',
    ],
  },
  {
    url: 'https://jag-icpc.org/?2006%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF',
    taskIds: [
      'NoJudge-JAGWinter2006-day2_a',
      'NoJudge-JAGWinter2006-day2_b',
      'NoJudge-JAGWinter2006-day2_c',
      'NoJudge-JAGWinter2006-day2_e',
      'NoJudge-JAGWinter2006-day2_g',
      'NoJudge-JAGWinter2006-day2_h',
      'NoJudge-JAGWinter2006-day2_i',
      'NoJudge-JAGWinter2006-day3_b',
      'NoJudge-JAGWinter2006-day3_c',
      'NoJudge-JAGWinter2006-day3_e',
      'NoJudge-JAGWinter2006-day3_f',
      'NoJudge-JAGWinter2006-day3_i',
      'NoJudge-JAGWinter2006-day3_j',
    ],
  },
  {
    url: 'https://jag-icpc.org/?2007%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF',
    taskIds: ['NoJudge-JAGWinter2007-day3_e'],
  },
  {
    url: 'https://jag-icpc.org/?2005%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8',
    taskIds: [
      'NoJudge-JAGRegional2005_c',
      'NoJudge-JAGRegional2005_f',
      'NoJudge-JAGRegional2005_h',
    ],
  },
  {
    url: 'https://jag-icpc.org/?2008%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8',
    taskIds: ['NoJudge-JAGRegional2008_j'],
  },
];

export const NO_JUDGE_TASK_URLS: ReadonlyMap<string, string> = new Map(
  NO_JUDGE_PAGES.flatMap(({ url, taskIds }) => taskIds.map((taskId) => [taskId, url] as const)),
);
