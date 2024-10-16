import { delay } from '$lib/utils/time';

// See:
// https://developer.mozilla.org/ja/docs/Web/API/Fetch_API/Using_Fetch
export async function fetchAPI<T>(url: string, error_messages: string): Promise<T[]> {
  try {
    // 外部APIへの過剰なアクセスを防ぐため、1秒待機
    await delay(1000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request has failed.');
    }

    return response.json();
  } catch (error) {
    console.error(error_messages, error);
    throw error;
  }
}
