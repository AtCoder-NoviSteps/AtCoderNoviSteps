import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { tasks } from '../../../../prisma/tasks';
import type { AOJChallengeContestAPI } from './types';

const readContests = (round: 'prelim' | 'final'): AOJChallengeContestAPI =>
  JSON.parse(
    readFileSync(
      `src/lib/clients/fixtures/aizu_online_judge/challenges/pck_${round}/contests.json`,
      'utf8',
    ),
  );

describe('PCK seed problem numbers', () => {
  test.each([
    ['prelim', 23, 263],
    ['final', 23, 318],
  ] as const)(
    'matches all %s seed indices to the official contest problem lists',
    (round, contestCount, taskCount) => {
      const contests = readContests(round).contests;
      const prefix = round === 'prelim' ? 'PCKPrelim' : 'PCKFinal';
      const seeded = tasks.filter((task) => task.contest_id.startsWith(prefix));

      expect(contests).toHaveLength(contestCount);
      expect(seeded).toHaveLength(taskCount);
      const expected = contests.flatMap((contest) =>
        contest.days
          .flatMap((day) => day.problems)
          .sort((first, second) => Number(first.id) - Number(second.id))
          .map((problem, index) => ({
            id: problem.id,
            contest_id: contest.abbr,
            problem_index: String(index + 1),
            title: problem.name.trim(),
          })),
      );
      expect(
        seeded
          .map(({ id, contest_id, problem_index, title }) => ({
            id,
            contest_id,
            problem_index,
            title,
          }))
          .sort((first, second) => first.id.localeCompare(second.id)),
      ).toEqual(expected.sort((first, second) => first.id.localeCompare(second.id)));
    },
  );

  test('numbers the 2026 preliminary round from problem 4084 and leaves problem ids unchanged', () => {
    expect(tasks.find((task) => task.id === '4084')).toMatchObject({
      contest_id: 'PCKPrelim2026',
      problem_index: '1',
      title: '2026',
    });
    expect(tasks.find((task) => task.id === '4086')).toMatchObject({
      contest_id: 'PCKPrelim2026',
      problem_index: '3',
      title: 'Chessboard Distance',
    });
    expect(tasks.find((task) => task.id === '4095')).toMatchObject({
      contest_id: 'PCKPrelim2026',
      problem_index: '12',
      title: "Kobou's Vocabulary Book",
    });
  });

  test('keeps task ids unique across the entire seed', () => {
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
  });
});
