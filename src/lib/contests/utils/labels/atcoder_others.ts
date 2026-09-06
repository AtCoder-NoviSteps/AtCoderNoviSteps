import { ATCODER_OTHERS } from '../prefixes';
import { generateAxcLabel, regexForAxc } from './axc';

// Handles atc\d{3}, ATCODER_OTHERS dict, chokudai_S prefix, and uppercase fallback.
// classifyContest maps these to OTHERS via prefix match, but the original
// getContestNameLabel dispatched them independently — this chain preserves that behavior.
export function generateOthersLabel(contestId: string): string {
  if (regexForAxc.test(contestId)) {
    return generateAxcLabel(contestId);
  }

  const othersLabel = ATCODER_OTHERS[contestId as keyof typeof ATCODER_OTHERS];
  if (othersLabel) return othersLabel;

  if (contestId.startsWith('chokudai_S')) {
    return contestId.replace('chokudai_S', 'Chokudai SpeedRun ');
  }

  return contestId.toUpperCase();
}
