import type { ContestForImport } from '#lib/contests/types/contest.js';

import { PENDING } from './types';
import type { AOJTaskAPI } from './types';

/**
 * Constructs an endpoint URL by encoding each segment and joining them with a '/'.
 *
 * @param segments - An array of strings representing the segments of the URL.
 * @returns The constructed endpoint URL as a string.
 */
export function buildEndpoint(segments: string[]): string {
  if (!segments?.length) {
    throw new Error('Endpoint segments array cannot be empty');
  }

  const MAX_SEGMENT_LENGTH = 100;
  const validateSegment = (segment: string): boolean => {
    return (
      segment.length <= MAX_SEGMENT_LENGTH &&
      /^[a-zA-Z](?:[a-zA-Z0-9]|[-_](?=[a-zA-Z0-9])){0,98}[a-zA-Z0-9]$/.test(segment) &&
      !segment.includes('..')
    );
  };

  for (const segment of segments) {
    if (!validateSegment(segment)) {
      throw new Error(
        `Invalid segment: ${segment}. Segments must be alphanumeric with hyphens and underscores, max length ${MAX_SEGMENT_LENGTH}`,
      );
    }
  }

  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

/**
 * Maps the given contest details to a `ContestForImport` object.
 *
 * @param contestId - The unique identifier for the contest.
 * @param title - The title of the contest.
 * @returns A `ContestForImport` object with the provided contest details.
 */
export function mapToContest(contestId: string, title: string): ContestForImport {
  return {
    id: contestId,
    start_epoch_second: PENDING, // Data not available
    duration_second: PENDING, // Same as above
    title: title.trim(),
    rate_change: '', // Same as above
  };
}

/**
 * Assigns problem letters (A, B, C...) to the problems of one contest.
 *
 * The AOJ API does not tell a problem's position in its contest, so this follows the basic rule:
 * letters in ascending numeric order of problem ids. A problem missing from AOJ's contest listing
 * shifts the later letters, which cannot be detected here.
 *
 * @param problemIds - Numeric AOJ problem ids of one contest.
 * @returns A map from problem id to problem letter.
 */
export function assignProblemLetters(problemIds: string[]): Map<string, string> {
  const sortedIds = [...problemIds].sort((first, second) => Number(first) - Number(second));

  return new Map(sortedIds.map((problemId, i) => [problemId, String.fromCharCode(65 + i)]));
}

/**
 * Maps the AOJTaskAPI problem object to a task object.
 *
 * @param problem - The problem object from AOJTaskAPI.
 * @param contestId - The ID of the contest.
 * @param problemIndex - The problem index. Defaults to the problem id.
 * @returns An object representing the task.
 */
export function mapToTask(
  problem: AOJTaskAPI,
  contestId: string,
  problemIndex: string = problem.id, // AtCoder Problems API uses the same substitute for old JOI problems.
) {
  return {
    id: problem.id,
    contest_id: contestId,
    problem_index: problemIndex,
    task_id: problem.id,
    title: problem.name.trim(),
  };
}

/**
 * Extracts the course name from a given task ID.
 *
 * The task ID is expected to be in the format `courseName_taskId_otherInfo` in courses
 * (e.g. ITP1_1_A, INFO1_01_E) and a numeric string in challenges (e.g. 0001, 0703).
 * Returns empty string if the format does not match.
 *
 * @param taskId - The task ID string from which to extract the course name.
 * @returns The extracted course name or an empty string if the format is incorrect.
 */
export function getCourseName(taskId: string): string {
  if (!taskId || typeof taskId !== 'string') {
    return '';
  }

  const parts = taskId.split('_');

  return parts.length === 3 ? parts[0] : '';
}
