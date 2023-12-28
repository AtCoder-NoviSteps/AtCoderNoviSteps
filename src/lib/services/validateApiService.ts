const confirmUrl = 'https://prettyhappy.sakura.ne.jp/php_curl/index.php';

import { sha256 } from '$lib/utils/hash';
import { default as db } from '$lib/server/database';

export async function confirm(username: string, atcoder_username: string) {
  try {
    const url = confirmUrl + '?user=' + atcoder_username;
    const response = await fetch(url);

    console.log(username);
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

export async function generate(username: string) {
  //ハッシュを作る
  const date = new Date().toISOString();
  const validationCode = await sha256(username + date);
  const user = await db.user.update({
    where: {
      username: username,
    },
    data: {
      atcoder_validation_code: validationCode,
    },
  });
  return user.atcoder_validation_code;
}
