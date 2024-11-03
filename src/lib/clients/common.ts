import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';
import { delay } from '$lib/utils/time';

/**
 * An abstract class representing a client for contest sites' APIs.
 * This class provides methods to fetch contests and tasks, and a protected method to fetch data from an API endpoint with a given configuration.
 *
 * @abstract
 */
export abstract class ContestSiteApiClient {
  abstract getContests(): Promise<ContestsForImport>;
  abstract getTasks(): Promise<TasksForImport>;

  /**
   * Fetches data from an API endpoint with the provided configuration.
   *
   * @template T - The expected response type.
   * @param {FetchAPIConfig<T>} config - The configuration object for the API request.
   * @param {string} config.baseApiUrl - The base URL of the API.
   * @param {string} config.endpoint - The specific endpoint to fetch data from.
   * @param {string} config.errorMessage - The error message to display if the fetch fails.
   * @param {(data: T) => boolean} [config.validateResponse] - An optional function to validate the response data.
   * @returns {Promise<T>} - A promise that resolves to the fetched data of type T.
   * @throws {Error} - Throws an error if the response validation fails.
   */
  protected async fetchApiWithConfig<T>({
    baseApiUrl,
    endpoint,
    errorMessage,
    validateResponse,
  }: FetchAPIConfig<T>): Promise<T> {
    try {
      const url = new URL(endpoint, baseApiUrl).toString();
      const data = await fetchAPI<T>(url, errorMessage);

      if (validateResponse && !validateResponse(data)) {
        throw new Error(`${errorMessage}. Response validation failed for ${endpoint}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch from ${endpoint}: ${error}`);
    }
  }
}

/**
 * Configuration object for fetching data from an API.
 *
 * @template T - The type of the data expected from the API response.
 *
 * @property {string} baseApiUrl - The base URL of the API.
 * @property {string} endpoint - The specific endpoint of the API to fetch data from.
 * @property {string} errorMessage - The error message to display if the fetch operation fails.
 * @property {(data: T) => boolean} [validateResponse] - Optional function to validate the API response data.
 */
export type FetchAPIConfig<T> = {
  baseApiUrl: string;
  endpoint: string;
  errorMessage: string;
  validateResponse?: (data: T) => boolean;
};

// See:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
export async function fetchAPI<T>(url: string, error_messages: string): Promise<T>;
export async function fetchAPI<T>(url: string, error_messages: string): Promise<T[]>;

export async function fetchAPI<T>(url: string, error_messages: string): Promise<T | T[]> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL is given.');
  }

  try {
    // Note: Wait for 1 second to prevent excessive external API calls.
    await delay(1000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 seconds
    });

    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const responseJson = await response.json();

    if (responseJson === null || responseJson === undefined) {
      throw new Error('Failed to parse the response.');
    }

    if (isArrayResponse<T>(responseJson)) {
      return responseJson;
    }

    return responseJson as T;
  } catch (error) {
    console.error(
      error_messages,
      error instanceof Error ? error.message : 'Unknown error occurred.',
    );
    throw error;
  }
}

function isArrayResponse<T>(response: unknown): response is T[] {
  return Array.isArray(response);
}
