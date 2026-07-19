import { describe, test, expect, vi, beforeEach } from 'vitest';

import { Roles } from '$lib/types/user';

vi.mock('$features/votes/services/vote_statistics', () => ({
  getVoteGradeStatistics: vi.fn(),
}));

vi.mock('$lib/services/task_results', () => ({
  getTaskResults: vi.fn(),
  getTasksWithTagIds: vi.fn(),
}));

import * as voteStatsModule from '$features/votes/services/vote_statistics';
import * as taskCrud from '$lib/services/task_results';
import { load } from './+page.server';

const mockGetVoteGradeStatistics = vi.mocked(voteStatsModule.getVoteGradeStatistics);
const mockGetTaskResults = vi.mocked(taskCrud.getTaskResults);
const mockGetTasksWithTagIds = vi.mocked(taskCrud.getTasksWithTagIds);

type MockSession = { user: { userId: string; username: string; role: Roles } } | null;

const createMockEvent = ({
  session = null,
  tagIds = null,
}: {
  session?: MockSession;
  tagIds?: string | null;
} = {}) => {
  const setHeaders = vi.fn();
  const locals = {
    auth: { validate: vi.fn().mockResolvedValue(session) },
    user: session
      ? {
          id: session.user.userId,
          name: session.user.username,
          role: session.user.role,
          atcoder_name: '',
          is_validated: false,
        }
      : undefined,
  };
  const url = { searchParams: { get: vi.fn().mockReturnValue(tagIds) } };

  return { locals, url, setHeaders } as unknown as Parameters<typeof load>[0] & {
    setHeaders: ReturnType<typeof vi.fn>;
  };
};

const LOGGED_IN_SESSION: MockSession = {
  user: { userId: 'user-abc123', username: 'testuser', role: Roles.USER },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTaskResults.mockResolvedValue([]);
  mockGetTasksWithTagIds.mockResolvedValue([]);
  mockGetVoteGradeStatistics.mockResolvedValue(new Map());
});

describe('load() cache-control behaviour', () => {
  // Shared caches key on URL + method + headers named by Vary only (RFC 9111), so an
  // anonymous response cached without `Vary: Cookie` is served to logged-in users too.
  describe('never sets a shared-cache header — shared caches ignore cookies without Vary (#3862)', () => {
    test('anonymous users', async () => {
      const event = createMockEvent({ session: null });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });

    test('anonymous users with tagIds', async () => {
      const event = createMockEvent({ session: null, tagIds: 'abc,dp' });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });

    test('logged-in users — personalized response must never be shared-cached', async () => {
      const event = createMockEvent({ session: LOGGED_IN_SESSION });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });

    test('degraded response when vote stats fail', async () => {
      mockGetVoteGradeStatistics.mockRejectedValue(new Error('DB timeout'));
      const event = createMockEvent({ session: null });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });
  });
});
