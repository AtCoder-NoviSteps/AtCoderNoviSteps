import { describe, test, expect, vi, beforeEach } from 'vitest';

import { Roles } from '$lib/types/user';

vi.mock('$features/votes/services/vote_statistics', () => ({
  getAllTasksWithVoteInfo: vi.fn(),
}));

import * as voteStatsModule from '$features/votes/services/vote_statistics';
import { load } from './+page.server';

const mockGetAllTasksWithVoteInfo = vi.mocked(voteStatsModule.getAllTasksWithVoteInfo);

type MockSession = { user: { userId: string; username: string; role: Roles } } | null;

const createMockEvent = ({ session = null }: { session?: MockSession } = {}) => {
  const setHeaders = vi.fn();
  const locals = {
    auth: { validate: vi.fn().mockResolvedValue(session) },
  };

  return { locals, setHeaders } as unknown as Parameters<typeof load>[0] & {
    setHeaders: ReturnType<typeof vi.fn>;
  };
};

const LOGGED_IN_SESSION: MockSession = {
  user: { userId: 'user-abc123', username: 'testuser', role: Roles.USER },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllTasksWithVoteInfo.mockResolvedValue([]);
});

describe('load() cache-control behaviour', () => {
  describe('sets cache-control', () => {
    test('anonymous users get a public shared-cache header when data fetch succeeds', async () => {
      const event = createMockEvent({ session: null });

      await load(event);

      expect(event.setHeaders).toHaveBeenCalledOnce();
      const headerArg = event.setHeaders.mock.calls[0][0] as Record<string, string>;
      expect(headerArg['Cache-Control']).toBe(
        'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      );
    });
  });

  describe('does not set cache-control', () => {
    test('logged-in users — personalized response must never be shared-cached', async () => {
      const event = createMockEvent({ session: LOGGED_IN_SESSION });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });

    test('degraded response when data fetch fails — avoids pinning a broken page at the CDN', async () => {
      mockGetAllTasksWithVoteInfo.mockRejectedValue(new Error('DB timeout'));
      const event = createMockEvent({ session: null });

      await load(event);

      expect(event.setHeaders).not.toHaveBeenCalled();
    });
  });
});

describe('load() return data', () => {
  test('returns tasks and isLoggedIn for anonymous users', async () => {
    mockGetAllTasksWithVoteInfo.mockResolvedValue([]);
    const event = createMockEvent({ session: null });

    const result = await load(event);

    expect(result.tasks).toEqual([]);
    expect(result.isLoggedIn).toBe(false);
  });

  test('returns tasks and isLoggedIn for logged-in users', async () => {
    mockGetAllTasksWithVoteInfo.mockResolvedValue([]);
    const event = createMockEvent({ session: LOGGED_IN_SESSION });

    const result = await load(event);

    expect(result.tasks).toEqual([]);
    expect(result.isLoggedIn).toBe(true);
  });

  test('returns empty tasks array when data fetch fails (degraded)', async () => {
    mockGetAllTasksWithVoteInfo.mockRejectedValue(new Error('DB timeout'));
    const event = createMockEvent({ session: null });

    const result = await load(event);

    expect(result.tasks).toEqual([]);
    expect(result.isLoggedIn).toBe(false);
  });
});
