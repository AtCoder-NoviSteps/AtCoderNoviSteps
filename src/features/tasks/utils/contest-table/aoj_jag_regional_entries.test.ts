import { describe, test, expect } from 'vitest';

import { tasks } from '../../../../../prisma/tasks';

import { AOJ_JAG_REGIONAL_ENTRIES } from './aoj_jag_regional_entries';

// JAG camps and regionals on AOJ, plus the JAG contests held on AtCoder (e.g. jag2018summer-day2).
const JAG_CONTEST_ID_PATTERN = /^(JAG(Summer|Winter|Spring|Regional)|jag\d{4})/;

describe('AOJ_JAG_REGIONAL_ENTRIES', () => {
  test('lists every JAG camp, regional and AtCoder JAG contest in the seed exactly once', () => {
    const seedContestIds = new Set(
      tasks
        .map((task) => task.contest_id)
        .filter((contestId) => JAG_CONTEST_ID_PATTERN.test(contestId)),
    );
    const entryContestIds = AOJ_JAG_REGIONAL_ENTRIES.map((entry) => entry.contestId);

    expect(entryContestIds.toSorted()).toEqual([...seedContestIds].toSorted());
  });
});
