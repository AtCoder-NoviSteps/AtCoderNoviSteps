import type { ContestLabelTranslations } from '$lib/contests/types/contest';

/**
 * Maps PCK contest type abbreviations to their Japanese translations.
 *
 * @example
 * {
 *   PCK: 'パソコン甲子園',
 *   Prelim: '予選',
 *   Final: '本選'
 * }
 */
export const PCK_TRANSLATIONS = {
  PCK: 'パソコン甲子園',
  Prelim: ' 予選 ',
  Final: ' 本選 ',
};

/**
 * Maps JAG contest type abbreviations to their Japanese translations.
 *
 * @example
 * {
 *   Prelim: '模擬国内',
 *   Regional: '模擬地区'
 * }
 */
export const JAG_TRANSLATIONS = {
  Prelim: ' 模擬国内 ',
  Regional: ' 模擬地区 ',
  Summer: ' 夏合宿 ',
  Winter: ' 冬合宿 ',
  Spring: ' 春合宿 ',
  '-day': ' Day',
};

export const ICPC_TRANSLATIONS = {
  Prelim: ' 国内予選 ',
  Regional: ' アジア地区 ',
};

export function getAojContestLabel(
  translations: Readonly<ContestLabelTranslations>,
  contestId: string,
): string {
  let label = contestId;

  Object.entries(translations).forEach(([abbrEnglish, japanese]) => {
    label = label.replace(abbrEnglish, japanese);
  });

  return '（' + label + '）';
}

export function getAojUniversityContestLabel(contestId: string): string {
  const label = contestId
    .replace(/^AOJ-/, '')
    .replace(/UAPC/g, 'ACPC')
    .replace(/([A-Z]{2,})(\d{4})/g, '$1 $2')
    .replace(/-in-/, ' in ')
    .replace(/-day(\d+)/, ' Day$1')
    .replace(/-summer/, ' Summer');
  return '（' + label + '）';
}
