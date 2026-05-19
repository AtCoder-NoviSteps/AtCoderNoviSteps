import type { Contests } from '$lib/types/contest';

export function filterContests(contests: Contests, query: string): Contests {
  const hasNoQuery = !query || query.trim() === '';
  const lowerQuery = query.trim().toLowerCase();

  return contests.filter((contest) => {
    if (contest.tasks.length === 0) {
      return false;
    }
    if (hasNoQuery) {
      return true;
    }
    return (
      contest.id.toLowerCase().includes(lowerQuery) ||
      contest.title.toLowerCase().includes(lowerQuery) ||
      contest.tasks.some((task) => task.title.toLowerCase().includes(lowerQuery))
    );
  });
}
