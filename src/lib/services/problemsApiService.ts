import { delay } from '$lib/utils/time';

// See:
// https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md
const allProblemsUrl = 'https://kenkoooo.com/atcoder/resources/problems.json';
const allContestsUrl = 'https://kenkoooo.com/atcoder/resources/contests.json';

const userSubmissionsUrl = (atcoder_username: string, start_time_in_unix_second: number) => {
  const OLDEST_CONTEST_IN_ATCODER = 1137317207; // 2006/01/15

  // Note: 日時指定がない場合を0として処理しているため
  if (start_time_in_unix_second < OLDEST_CONTEST_IN_ATCODER) {
    start_time_in_unix_second = OLDEST_CONTEST_IN_ATCODER;
  }

  const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoder_username}&from_second=${start_time_in_unix_second}`;

  return url;
};

// TODO: 単体テストを書いて、コードが重複している部分をリファクタリングする
export async function getTasks() {
  try {
    const response = await fetch(allProblemsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  } catch (error) {
    // Handle error
    console.error('There was a problem fetching data:', error);
    throw error;
  }
}

export async function getContests() {
  try {
    const response = await fetch(allContestsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  } catch (error) {
    // Handle error
    console.error('There was a contests fetching data:', error);
    throw error;
  }
}

export async function getUserSubmissions(
  atcoder_username: string,
  start_time_in_unix_second: number,
) {
  const url = userSubmissionsUrl(atcoder_username, start_time_in_unix_second);
  const userSubmissions = await fetchAtCoderProblemsAPI(url, 'Failed to fetch submissions: ');

  return userSubmissions;
}

// See:
// https://developer.mozilla.org/ja/docs/Web/API/Fetch_API/Using_Fetch
async function fetchAtCoderProblemsAPI(url: string, error_messages: string) {
  try {
    // APIへの過剰なアクセスを防ぐため、1秒待機
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
    // TODO: Handle errors.
    console.error(error_messages, error);
    throw error;
  }
}
