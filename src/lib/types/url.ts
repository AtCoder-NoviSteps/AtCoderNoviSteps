/**
 * Interface representing a URL generator for contests.
 *
 * @interface UrlGenerator
 *
 * @method canHandle
 * @param {string} contestId - The ID of the contest.
 * @returns {boolean} - Returns true if the generator can handle the given contest ID, otherwise false.
 *
 * @method generateUrl
 * @param {string} contestId - The ID of the contest.
 * @param {string} taskId - The ID of the task within the contest.
 * @returns {string} - Returns the generated URL for the given contest and task IDs.
 */
export interface UrlGenerator {
  canHandle(contestId: string): boolean;
  generateUrl(contestId: string, taskId: string): string;
}

export type UrlGenerators = UrlGenerator[];
