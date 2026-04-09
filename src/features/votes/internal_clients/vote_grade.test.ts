import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import { TaskGrade } from '$lib/types/task';

import { fetchMyVote, submitVote, fetchMedianVote } from './vote_grade';

import * as statusCodes from '$lib/constants/http-response-status-codes';

const BASE_URL = 'http://localhost';
const TASK_ID = 'abc_a';

const originalLocation = globalThis.location;

beforeEach(() => {
  nock.cleanAll();
  // Set globalThis.location for test environment
  Object.defineProperty(globalThis, 'location', {
    value: { origin: BASE_URL },
    writable: true,
  });
});

afterEach(() => {
  nock.cleanAll();
  // Restore original location to prevent test state leak
  if (originalLocation !== undefined) {
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
    });
  }
});

describe('fetchMyVote', () => {
  const endpoint = '/problems/getMyVote';

  const mockGetMyVote = (statusCode: number, grade?: TaskGrade | null) => {
    nock(BASE_URL)
      .get(endpoint)
      .query({ taskId: TASK_ID })
      .reply(statusCode, grade !== undefined ? { grade } : undefined);
  };

  describe('successful case', () => {
    test.each([
      TaskGrade.PENDING,
      TaskGrade.Q11,
      TaskGrade.Q10,
      TaskGrade.Q1,
      TaskGrade.D1,
      TaskGrade.D6,
    ])('returns grade %s when voted', async (grade) => {
      mockGetMyVote(statusCodes.OK, grade);

      const result = await fetchMyVote(TASK_ID);

      expect(result).toBe(grade);
    });

    test('returns null when no vote exists', async () => {
      mockGetMyVote(statusCodes.OK, null);

      const result = await fetchMyVote(TASK_ID);

      expect(result).toBeNull();
    });
  });

  describe('error cases', () => {
    test('returns null when unauthorized', async () => {
      mockGetMyVote(statusCodes.UNAUTHORIZED);

      const result = await fetchMyVote(TASK_ID);

      expect(result).toBeNull();
    });

    test('returns null when server error', async () => {
      mockGetMyVote(statusCodes.INTERNAL_SERVER_ERROR);

      const result = await fetchMyVote(TASK_ID);

      expect(result).toBeNull();
    });
  });
});

describe('submitVote', () => {
  const endpoint = '/votes?/voteAbsoluteGrade';
  const actionUrl = new URL(`${BASE_URL}${endpoint}`);
  const formData = (() => {
    const data = new FormData();
    data.append('taskId', TASK_ID);
    data.append('grade', TaskGrade.Q11);
    return data;
  })();

  describe('successful case', () => {
    test('returns true when status code is 2xx', async () => {
      nock(BASE_URL).post(endpoint).reply(statusCodes.OK, { success: true });

      const result = await submitVote(actionUrl, formData);

      expect(result).toBe(true);
    });
  });

  describe('error cases', () => {
    test.each([
      statusCodes.BAD_REQUEST,
      statusCodes.UNAUTHORIZED,
      statusCodes.FORBIDDEN,
      statusCodes.INTERNAL_SERVER_ERROR,
    ])('returns false when status code is %s', async (statusCode) => {
      nock(BASE_URL).post(endpoint).reply(statusCode);

      const result = await submitVote(actionUrl, formData);

      expect(result).toBe(false);
    });

    test('returns false when request is aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await submitVote(actionUrl, formData, controller.signal);

      expect(result).toBe(false);
    });
  });
});

describe('fetchMedianVote', () => {
  const endpoint = '/problems/getMedianVote';

  const mockGetMedianVote = (statusCode: number, grade?: TaskGrade | null) => {
    nock(BASE_URL)
      .get(endpoint)
      .query({ taskId: TASK_ID })
      .reply(statusCode, grade !== undefined ? { grade } : undefined);
  };

  describe('successful case', () => {
    test.each([
      TaskGrade.PENDING,
      TaskGrade.Q11,
      TaskGrade.Q10,
      TaskGrade.Q1,
      TaskGrade.D1,
      TaskGrade.D6,
    ])('returns grade %s when fetched', async (grade) => {
      mockGetMedianVote(statusCodes.OK, grade);

      const result = await fetchMedianVote(TASK_ID);

      expect(result).toBe(grade);
    });

    test('returns null when no median exists', async () => {
      mockGetMedianVote(statusCodes.OK, null);

      const result = await fetchMedianVote(TASK_ID);

      expect(result).toBeNull();
    });
  });

  describe('error cases', () => {
    test('returns null when server error', async () => {
      mockGetMedianVote(statusCodes.INTERNAL_SERVER_ERROR);

      const result = await fetchMedianVote(TASK_ID);

      expect(result).toBeNull();
    });
  });
});
