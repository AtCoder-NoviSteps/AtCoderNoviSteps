import type { TaskGrade } from '$lib/types/task';
import { isValidTaskGrade } from '$lib/utils/task_grade';
import { browser } from '$app/environment';

/**
 * Fetches the current user's vote grade for a given task.
 * @returns The voted grade, or null if not voted or request fails.
 */
export async function fetchMyVote(taskId: string): Promise<TaskGrade | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/problems/getMyVote?taskId=${encodeURIComponent(taskId)}`,
      {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return isValidTaskGrade(data.grade) ? data.grade : null;
  } catch {
    return null;
  }
}

/**
 * Submits a vote via POST to the given action URL.
 * @param signal - Optional AbortSignal to cancel an in-flight request.
 * @returns true if the server responded with ok status, false otherwise.
 */
export async function submitVote(
  action: URL,
  formData: FormData,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const response = await fetch(action, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal,
    });

    return response.ok;
  } catch {
    // AbortError or network error
    return false;
  }
}

/**
 * Fetches the current median vote grade for a given task.
 * @returns The median grade, or null if not enough votes or request fails.
 */
export async function fetchMedianVote(
  taskId: string,
  signal?: AbortSignal,
): Promise<TaskGrade | null> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/problems/getMedianVote?taskId=${encodeURIComponent(taskId)}`,
      {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return isValidTaskGrade(data.grade) ? data.grade : null;
  } catch {
    return null;
  }
}

// Helper to get base URL (works in browser and Node.js test environments)
function getBaseUrl(): string {
  if (typeof globalThis !== 'undefined' && globalThis.location?.origin) {
    return globalThis.location.origin;
  }

  if (!browser) {
    console.warn(
      'getBaseUrl() called in SSR context where browser APIs are unavailable. ' +
        'This should only be called from client-side code.',
    );

    return '';
  }

  return 'http://localhost';
}
