import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import { TaskGrade } from '$lib/types/task';

import { fetchMyVote, submitVote, fetchMedianVote } from './vote_grade';

beforeEach(() => {
  nock.cleanAll();
  // Set globalThis.location for test environment
  Object.defineProperty(globalThis, 'location', {
    value: { origin: 'http://localhost' },
    writable: true,
  });
});

afterEach(() => {
  nock.cleanAll();
});

describe('fetchMyVote', () => {
  test('returns grade when server responds with a voted grade', async () => {
    nock('http://localhost')
      .get('/problems/getMyVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: TaskGrade.Q11 });

    const result = await fetchMyVote('abc_a');

    expect(result).toBe(TaskGrade.Q11);
  });

  test('returns null when server responds with null grade', async () => {
    nock('http://localhost')
      .get('/problems/getMyVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: null });

    const result = await fetchMyVote('abc_a');

    expect(result).toBeNull();
  });

  test('returns null when server responds with non-ok status', async () => {
    nock('http://localhost').get('/problems/getMyVote').query({ taskId: 'abc_a' }).reply(401);

    const result = await fetchMyVote('abc_a');

    expect(result).toBeNull();
  });
});

describe('submitVote', () => {
  test('returns true when server responds with ok status', async () => {
    const formData = new FormData();
    formData.append('taskId', 'abc_a');
    formData.append('grade', TaskGrade.Q11);

    nock('http://localhost').post('/votes?/voteAbsoluteGrade').reply(200, { success: true });

    const result = await submitVote(new URL('http://localhost/votes?/voteAbsoluteGrade'), formData);

    expect(result).toBe(true);
  });

  test('returns false when server responds with error status', async () => {
    const formData = new FormData();

    nock('http://localhost').post('/votes?/voteAbsoluteGrade').reply(500);

    const result = await submitVote(new URL('http://localhost/votes?/voteAbsoluteGrade'), formData);

    expect(result).toBe(false);
  });

  test('returns false when request is aborted', async () => {
    const formData = new FormData();
    const controller = new AbortController();
    controller.abort();

    const result = await submitVote(
      new URL('http://localhost/votes?/voteAbsoluteGrade'),
      formData,
      controller.signal,
    );

    expect(result).toBe(false);
  });
});

describe('fetchMedianVote', () => {
  test('returns grade when server responds with a median grade', async () => {
    nock('http://localhost')
      .get('/problems/getMedianVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: TaskGrade.Q10 });

    const result = await fetchMedianVote('abc_a');

    expect(result).toBe(TaskGrade.Q10);
  });

  test('returns null when server responds with null grade', async () => {
    nock('http://localhost')
      .get('/problems/getMedianVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: null });

    const result = await fetchMedianVote('abc_a');

    expect(result).toBeNull();
  });

  test('returns null when server responds with non-ok status', async () => {
    nock('http://localhost').get('/problems/getMedianVote').query({ taskId: 'abc_a' }).reply(500);

    const result = await fetchMedianVote('abc_a');

    expect(result).toBeNull();
  });
});
